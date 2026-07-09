const SAFE_BROWSING_ENDPOINT =
    "https://safebrowsing.googleapis.com/v4/threatMatches:find";

// Threat types we ask Google to screen for.
const THREAT_TYPES = [
    "MALWARE",
    "SOCIAL_ENGINEERING", // phishing
    "UNWANTED_SOFTWARE",
    "POTENTIALLY_HARMFUL_APPLICATION",
];

// Map Google's threat codes to human-readable labels for user-facing messages.
const THREAT_LABELS = {
    MALWARE: "malware",
    SOCIAL_ENGINEERING: "phishing",
    UNWANTED_SOFTWARE: "unwanted software",
    POTENTIALLY_HARMFUL_APPLICATION: "a potentially harmful application",
};

/**
 * Check a URL against the Google Safe Browsing Lookup API.
 *
 * @param {string} url
 * @returns {Promise<{ safe: boolean, threats: string[], checked: boolean }>}
 *   - safe:    true if no threats were found (or the check was skipped)
 *   - threats: human-readable threat labels when unsafe
 *   - checked: false when the check was skipped or failed (fail-open)
 */
exports.checkUrlSafety = async (url) => {
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

    // No key configured → skip the check so local/dev still works.
    if (!apiKey) {
        return { safe: true, threats: [], checked: false };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const res = await fetch(`${SAFE_BROWSING_ENDPOINT}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
                client: { clientId: "nanoalias", clientVersion: "1.0.0" },
                threatInfo: {
                    threatTypes: THREAT_TYPES,
                    platformTypes: ["ANY_PLATFORM"],
                    threatEntryTypes: ["URL"],
                    threatEntries: [{ url }],
                },
            }),
        });

        if (!res.ok) {
            console.error("Safe Browsing API error: HTTP", res.status);
            return { safe: true, threats: [], checked: false }; // fail open
        }

        const data = await res.json();

        // An empty object means no matches → the URL is clean.
        if (!data.matches || data.matches.length === 0) {
            return { safe: true, threats: [], checked: true };
        }

        const threats = [
            ...new Set(
                data.matches.map((m) => THREAT_LABELS[m.threatType] || "a security threat")
            ),
        ];

        return { safe: false, threats, checked: true };
    } catch (err) {
        // Network error / timeout / abort → fail open, mark as unchecked.
        console.error("Safe Browsing check failed:", err.message);
        return { safe: true, threats: [], checked: false };
    } finally {
        clearTimeout(timeout);
    }
};
