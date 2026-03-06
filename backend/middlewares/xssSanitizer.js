const { filterXSS } = require("xss");

/**
 * Recursively sanitize all string values in an object to strip
 * malicious HTML / <script> tags from user input.
 */
function sanitize(value) {
    if (typeof value === "string") {
        return filterXSS(value);
    }
    if (Array.isArray(value)) {
        return value.map(sanitize);
    }
    if (value !== null && typeof value === "object") {
        const clean = {};
        for (const key of Object.keys(value)) {
            clean[key] = sanitize(value[key]);
        }
        return clean;
    }
    return value;
}

/**
 * Express middleware – sanitizes req.body, req.query, and req.params
 * against XSS payloads using the battle-tested `xss` library.
 */
exports.xssSanitizer = (req, _res, next) => {
    if (req.body) req.body = sanitize(req.body);
    if (req.query) req.query = sanitize(req.query);
    if (req.params) req.params = sanitize(req.params);
    next();
};
