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

/**
 * Best-effort fetch of a URL's title and description.
 * Always resolves (never throws) — returns {} when anything goes wrong.
 *
 * @param {string} url
 * @returns {Promise<{ title?: string, description?: string, siteName?: string }>}
 */
exports.fetchUrlMetadata = async (url) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
        const res = await fetch(url, {
            signal: controller.signal,
            redirect: "follow",
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; NanoAliasBot/1.0; +https://nanoalias.com)",
                Accept: "text/html,application/xhtml+xml",
            },
        });

        const type = res.headers.get("content-type") || "";
        if (!res.ok || !type.includes("text/html")) return {};

        // The <head> is near the top; cap processing to keep it cheap.
        const html = (await res.text()).slice(0, 200000);

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
