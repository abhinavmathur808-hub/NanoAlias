const bcrypt = require("bcryptjs");
const Url = require("../models/Url");
const Analytics = require("../models/Analytics");
const { generateShortCode } = require("../utils/generateNanoId");
const { cacheUrlData, getCachedUrlData, invalidateCache } = require("../services/redisService");
const { logClick } = require("../services/analyticsService");
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
