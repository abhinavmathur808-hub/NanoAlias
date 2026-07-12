// Lightweight, dependency-free page-metadata fetcher. Pulls a destination's
// title / description so alias suggestions can be based on real page content.

const ENTITIES = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
};

const decodeEntities = (str) =>
    str.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&apos;|&nbsp;/g, (m) => ENTITIES[m] || m);

// Extract the `content` of a <meta> tag identified by property/name = key,
// tolerant of attribute order within the tag.
const metaContent = (html, key) => {
    const tag = html.match(
        new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*>`, "i")
    );
    if (!tag) return "";
    const c = tag[0].match(/content=["']([^"']*)["']/i);
    return c ? decodeEntities(c[1].trim()) : "";
};

const isYouTube = (url) => {
    try {
        const host = new URL(url).hostname.toLowerCase();
        return host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com");
    } catch {
        return false;
    }
};

// Extract the raw video ID from any YouTube URL form: youtu.be/{id},
// watch?v={id}, /shorts/{id}, /embed/{id}, /live/{id}.
const getYouTubeVideoId = (url) => {
    try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase().replace(/^www\./, "");
        let id = null;
        if (host === "youtu.be") {
            id = u.pathname.split("/").filter(Boolean)[0] || null;
        } else {
            id = u.searchParams.get("v");
            if (!id) {
                const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]+)/);
                if (m) id = m[1];
            }
        }
        return id && /^[A-Za-z0-9_-]{5,20}$/.test(id) ? id : null;
    } catch {
        return null;
    }
};

// YouTube blocks HTML scraping from datacenter IPs (consent walls / bot
// checks), so use its official oEmbed API instead — public, keyless JSON.
const fetchYouTubeMetadata = async (url) => {
    // Canonicalise to a clean watch URL first: strips tracking params
    // (?si=…) and normalises youtu.be / shorts / embed / mobile forms so
    // oEmbed always receives the shape it is guaranteed to accept.
    const videoId = getYouTubeVideoId(url);
    const target = videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
        const res = await fetch(
            `https://www.youtube.com/oembed?url=${encodeURIComponent(target)}&format=json`,
            { signal: controller.signal, headers: { Accept: "application/json" } }
        );
        if (!res.ok) return {};
        const data = await res.json();
        return {
            title: data.title || "",
            description: data.author_name ? `Video by ${data.author_name}` : "",
            siteName: "YouTube",
        };
    } catch (err) {
        console.error("YouTube oEmbed fetch failed:", err.message);
        return {};
    } finally {
        clearTimeout(timeout);
    }
};

/**
 * Best-effort fetch of a URL's title and description.
 * Always resolves (never throws) — returns {} when anything goes wrong.
 *
 * @param {string} url
 * @returns {Promise<{ title?: string, description?: string, siteName?: string }>}
 */
exports.fetchUrlMetadata = async (url) => {
    if (isYouTube(url)) return fetchYouTubeMetadata(url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
        const res = await fetch(url, {
            signal: controller.signal,
            redirect: "follow",
            headers: {
                // Full browser UA — sites like YouTube block obvious bot UAs
                // or serve consent shells instead of the real page.
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                Accept: "text/html,application/xhtml+xml",
                "Accept-Language": "en-US,en;q=0.9",
            },
        });

        const type = res.headers.get("content-type") || "";
        if (!res.ok || !type.includes("text/html")) return {};

        // Cap regex work on pathological pages. The cap must be generous:
        // sites like YouTube put ~650KB of inline script before <title>.
        const html = (await res.text()).slice(0, 2000000);

        const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        const title =
            metaContent(html, "og:title") ||
            (titleTag ? decodeEntities(titleTag[1].trim()) : "");
        const description =
            metaContent(html, "description") || metaContent(html, "og:description");
        const siteName = metaContent(html, "og:site_name");

        return { title, description, siteName };
    } catch (err) {
        console.error("Metadata fetch failed:", err.message);
        return {};
    } finally {
        clearTimeout(timeout);
    }
};

// Noise tokens that carry no topical meaning in a URL.
const STOP_WORDS = new Set([
    "www", "com", "net", "org", "html", "htm", "php", "aspx", "index",
    "watch", "amp", "ref", "utm", "src", "true", "false", "null",
]);

// Query params whose values carry human-readable words (search terms etc.).
// Everything else — v, id, list, si, hashes — is opaque and must be ignored.
const MEANINGFUL_QUERY_KEYS = new Set(["q", "query", "search", "keywords", "title", "text", "name"]);

// A token counts as a real word only if it has vowels and no digits —
// opaque IDs (video IDs, hashes) are digit-mixed and/or vowel-less, and
// splitting on hyphens can leave short chunks of them (e.g. "vlrxs").
const isReadableWord = (w) =>
    w.length >= 3 &&
    w.length <= 20 &&
    !STOP_WORDS.has(w) &&
    !/\d/.test(w) &&
    /[aeiou]/.test(w);

/**
 * Derive keyword hints from the URL string itself (domain + path words +
 * allowlisted query values). Used as fallback context when the live page
 * can't be scraped, so alias generation always has something meaningful —
 * and never opaque ID fragments — to work from.
 *
 * @param {string} rawUrl
 * @returns {{ domain: string, words: string[] }}
 */
exports.buildUrlHints = (rawUrl) => {
    try {
        const u = new URL(rawUrl);

        const hostParts = u.hostname.toLowerCase().split(".").filter((p) => p !== "www");
        // Drop the TLD; keep the registrable name (e.g. "youtube", "docs-stripe").
        const domain = (hostParts.length > 1 ? hostParts.slice(0, -1) : hostParts).join("-");

        // Path segments only — query values are opaque unless allowlisted.
        let raw = decodeURIComponent(u.pathname);
        for (const [key, value] of u.searchParams) {
            if (MEANINGFUL_QUERY_KEYS.has(key.toLowerCase())) raw += ` ${value}`;
        }

        const words = [
            ...new Set(raw.toLowerCase().split(/[^a-z0-9]+/).filter(isReadableWord)),
        ].slice(0, 8);

        return { domain, words };
    } catch {
        return { domain: "", words: [] };
    }
};
