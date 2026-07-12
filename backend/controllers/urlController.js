const bcrypt = require("bcryptjs");
const Url = require("../models/Url");
const Analytics = require("../models/Analytics");
const { generateShortCode } = require("../utils/generateNanoId");
const { cacheUrlData, getCachedUrlData, invalidateCache } = require("../services/redisService");
const { logClick } = require("../services/analyticsService");
const { checkUrlSafety } = require("../services/safeBrowsingService");
const { fetchUrlMetadata, buildUrlHints } = require("../services/metadataService");
const { suggestAliases } = require("../services/geminiService");
const AppError = require("../utils/AppError");

const URL_REGEX = /^https?:\/\/.+/i;

exports.createShortUrl = async (req, res, next) => {
    try {
        let { originalUrl, customAlias, password, expiresAt, oneTimeUse, tags } = req.body;

        if (!originalUrl || !URL_REGEX.test(originalUrl)) {
            return next(new AppError("A valid HTTP or HTTPS URL is required", 400));
        }

        if (!customAlias || !customAlias.trim()) {
            customAlias = undefined;
        } else {
            customAlias = customAlias.trim();
        }

        let shortCode;

        if (customAlias) {
            const aliasTaken = await Url.findOne({
                $or: [{ shortCode: customAlias }, { customAlias }],
            });
            if (aliasTaken) return next(new AppError("Custom alias is already taken", 409));
            shortCode = customAlias;
        } else {
            shortCode = generateShortCode();
        }

        // Screen the destination against Google Safe Browsing. Known
        // malware/phishing URLs are refused to protect the short domain.
        const safety = await checkUrlSafety(originalUrl);
        if (!safety.safe) {
            return next(
                new AppError(
                    `This URL was flagged as ${safety.threats.join(", ")} and cannot be shortened.`,
                    400
                )
            );
        }

        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 12);
        }

        const urlDoc = await Url.create({
            originalUrl,
            shortCode,
            customAlias: customAlias || undefined,
            user: req.user?.id || null,
            password: hashedPassword,
            expiresAt: expiresAt || null,
            oneTimeUse: oneTimeUse || false,
            tags: tags || [],
            safety: {
                status: safety.checked ? "safe" : "unchecked",
                threats: [],
                checkedAt: safety.checked ? new Date() : null,
            },
        });

        await cacheUrlData(shortCode, {
            _id: urlDoc._id,
            originalUrl,
            status: urlDoc.status,
            expiresAt: urlDoc.expiresAt,
            oneTimeUse: urlDoc.oneTimeUse,
            hasPassword: !!hashedPassword,
        });

        const response = urlDoc.toObject();
        delete response.password;

        res.status(201).json({ success: true, data: response });
    } catch (err) {
        next(err);
    }
};

const normalizeSlug = (raw) =>
    String(raw)
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 24);

const filterAvailable = async (slugs) => {
    if (!slugs.length) return [];
    const taken = await Url.find({
        $or: [{ shortCode: { $in: slugs } }, { customAlias: { $in: slugs } }],
    }).select("shortCode customAlias");

    const takenSet = new Set();
    taken.forEach((u) => {
        takenSet.add(u.shortCode);
        if (u.customAlias) takenSet.add(u.customAlias);
    });
    return slugs.filter((s) => !takenSet.has(s));
};

// Filler/noise words that shouldn't spend one of the 3-5 slug word slots.
const TITLE_STOP_WORDS = new Set([
    "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for",
    "with", "by", "at", "from", "is", "are", "was", "be", "this", "that",
    "it", "its", "your", "you", "my", "our", "how", "what", "why",
    // media-title noise
    "official", "video", "lyric", "lyrics", "audio", "hd", "remaster",
    "remastered", "feat", "ft", "trailer", "full",
]);

// Tier 2 fallback: slugify a scraped page title into up to 3 variants of
// its first 3-5 meaningful words (e.g. "Rick Astley - Never Gonna Give You
// Up (Official Video)" → "rick-astley-never", "rick-astley-never-gonna", …).
const buildTitleSlugs = (title) => {
    const words = String(title)
        .toLowerCase()
        .replace(/[^a-z0-9\s]+/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 2 && !TITLE_STOP_WORDS.has(w) && !/^\d+$/.test(w));

    const out = [];
    for (const count of [3, 4, 5]) {
        let slug = "";
        for (const w of words.slice(0, count)) {
            const next = slug ? `${slug}-${w}` : w;
            if (next.length > 24) break;
            slug = next;
        }
        if (slug.length >= 3 && !out.includes(slug)) out.push(slug);
    }
    return out;
};

// Domains whose raw name reads poorly in a slug (e.g. "youtu-x7k2") —
// substitute a natural word for fallback slug building.
const FALLBACK_DOMAIN_WORDS = {
    youtu: "video",
    youtube: "video",
};

// Deterministic slugs derived from the URL itself — used to top up the list
// when the AI returns nothing usable (opaque URLs, odd responses).
const buildFallbackSlugs = (hints) => {
    const base = FALLBACK_DOMAIN_WORDS[hints.domain] || hints.domain;
    const out = [];
    const push = (s) => {
        const slug = normalizeSlug(s);
        if (slug.length >= 3 && !out.includes(slug)) out.push(slug);
    };
    for (const w of hints.words) {
        push(w);
        if (base) push(`${base}-${w}`);
        if (out.length >= 6) break;
    }
    if (base) {
        push(base);
        push(`${base}-${generateShortCode(4)}`);
        push(`${base}-${generateShortCode(4)}`);
    }
    return out;
};

exports.suggestAlias = async (req, res, next) => {
    try {
        const { originalUrl } = req.body;

        if (!originalUrl || !URL_REGEX.test(originalUrl)) {
            return next(new AppError("A valid HTTP or HTTPS URL is required", 400));
        }

        const metadata = await fetchUrlMetadata(originalUrl);
        const hints = buildUrlHints(originalUrl);

        // ── Tier 1: AI-generated slugs ──
        let available = [];
        let source = "ai";
        const result = await suggestAliases({
            url: originalUrl,
            title: metadata.title,
            description: metadata.description,
            domain: hints.domain,
            hints: hints.words,
        });
        if (result.ok) {
            const cleaned = [];
            for (const raw of result.suggestions) {
                const slug = normalizeSlug(raw);
                if (slug.length >= 3 && !cleaned.includes(slug)) cleaned.push(slug);
            }
            available = await filterAvailable(cleaned);
        } else if (result.status === 503) {
            // Not configured — surface it so the operator knows, rather than
            // silently masking a missing API key with programmatic slugs.
            return next(new AppError(result.message, result.status));
        } else {
            // Quota (429) / upstream errors degrade to the programmatic tiers.
            source = "fallback";
        }

        // ── Tier 2: slugs derived from the scraped page title ──
        if (available.length < 3 && metadata.title) {
            const t2 = buildTitleSlugs(metadata.title).filter((s) => !available.includes(s));
            available = [...available, ...(await filterAvailable(t2))];
        }

        // ── Tier 3: deterministic domain/URL-hint slugs — never-empty net ──
        if (available.length < 3) {
            const t3 = buildFallbackSlugs(hints).filter((s) => !available.includes(s));
            available = [...available, ...(await filterAvailable(t3))];
        }

        res.json({
            success: true,
            suggestions: available.slice(0, 3),
            title: metadata.title || null,
            source,
        });
    } catch (err) {
        next(err);
    }
};

exports.redirectUrl = async (req, res, next) => {
    try {
        const { alias } = req.params;

        let urlData = await getCachedUrlData(alias);
        let urlDoc = null;
        let cacheHit = !!urlData;

        if (!urlData) {
            urlDoc = await Url.findOne({
                $or: [{ shortCode: alias }, { customAlias: alias }],
            }).select("+password");

            if (!urlDoc) {
                return res.status(404).json({ success: false, message: "Short URL not found" });
            }

            urlData = {
                _id: urlDoc._id,
                originalUrl: urlDoc.originalUrl,
                status: urlDoc.status,
                expiresAt: urlDoc.expiresAt,
                oneTimeUse: urlDoc.oneTimeUse,
                hasPassword: !!urlDoc.password,
            };
        }

        if (urlData.status === "disabled" || urlData.status === "archived") {
            return res.redirect(`${process.env.CLIENT_URL}/expired`);
        }

        if (urlData.expiresAt && new Date(urlData.expiresAt) < new Date()) {
            await Url.findByIdAndUpdate(urlData._id, { status: "disabled" });
            await invalidateCache(alias);
            return res.redirect(`${process.env.CLIENT_URL}/expired`);
        }

        if (urlData.hasPassword) {
            return res.redirect(`${process.env.CLIENT_URL}/unlock/${alias}`);
        }

        if (urlData.oneTimeUse) {
            await Url.findByIdAndUpdate(urlData._id, { status: "disabled" });
            await invalidateCache(alias);
        }

        if (!cacheHit) {
            await cacheUrlData(alias, urlData);
        }

        logClick(req, urlData).catch((err) =>
            console.error("Analytics fire-and-forget error:", err.message)
        );

        res.redirect(302, urlData.originalUrl);
    } catch (err) {
        next(err);
    }
};

exports.getUserUrls = async (req, res, next) => {
    try {
        const urls = await Url.find({ user: req.user.id }).sort("-createdAt");
        res.json({ success: true, data: urls });
    } catch (err) {
        next(err);
    }
};

exports.deleteUrl = async (req, res, next) => {
    try {
        const url = await Url.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!url) return next(new AppError("URL not found", 404));
        await invalidateCache(url.shortCode);
        if (url.customAlias) await invalidateCache(url.customAlias);
        await Analytics.deleteMany({ urlId: url._id });
        res.json({ success: true, message: "URL deleted" });
    } catch (err) {
        next(err);
    }
};

exports.updateUrl = async (req, res, next) => {
    try {
        const { originalUrl, status, expiresAt } = req.body;
        const url = await Url.findOne({ _id: req.params.id, user: req.user.id });
        if (!url) return next(new AppError("URL not found", 404));

        if (originalUrl !== undefined) {
            if (!URL_REGEX.test(originalUrl)) {
                return next(new AppError("A valid HTTP or HTTPS URL is required", 400));
            }
            url.originalUrl = originalUrl;
        }
        if (status !== undefined) url.status = status;
        if (expiresAt !== undefined) url.expiresAt = expiresAt || null;

        await url.save();

        await invalidateCache(url.shortCode);
        if (url.customAlias) await invalidateCache(url.customAlias);

        const response = url.toObject();
        delete response.password;

        res.json({ success: true, data: response });
    } catch (err) {
        next(err);
    }
};

exports.unlockUrl = async (req, res, next) => {
    try {
        const { shortCode } = req.params;
        const { password } = req.body;

        if (!password) {
            return next(new AppError("Password is required", 400));
        }

        const urlDoc = await Url.findOne({
            $or: [{ shortCode }, { customAlias: shortCode }],
        }).select("+password");

        if (!urlDoc) {
            return next(new AppError("Short URL not found", 404));
        }

        if (urlDoc.status === "disabled" || urlDoc.status === "archived") {
            return next(new AppError("This link is no longer available", 410));
        }

        if (urlDoc.expiresAt && new Date(urlDoc.expiresAt) < new Date()) {
            await Url.findByIdAndUpdate(urlDoc._id, { status: "disabled" });
            await invalidateCache(shortCode);
            if (urlDoc.customAlias) await invalidateCache(urlDoc.customAlias);
            return next(new AppError("This link has expired", 410));
        }

        if (!urlDoc.password) {
            return res.json({ success: true, originalUrl: urlDoc.originalUrl });
        }

        const isMatch = await bcrypt.compare(password, urlDoc.password);
        if (!isMatch) {
            return next(new AppError("Incorrect password", 401));
        }

        if (urlDoc.oneTimeUse) {
            await Url.findByIdAndUpdate(urlDoc._id, { status: "disabled" });
            await invalidateCache(shortCode);
        }

        logClick(req, {
            _id: urlDoc._id,
            originalUrl: urlDoc.originalUrl,
            status: urlDoc.status,
        }).catch((err) =>
            console.error("Analytics fire-and-forget error:", err.message)
        );

        res.json({ success: true, originalUrl: urlDoc.originalUrl });
    } catch (err) {
        next(err);
    }
};
