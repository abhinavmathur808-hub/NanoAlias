const GEMINI_ENDPOINT =
    "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.0-flash";

const SYSTEM_INSTRUCTION = `You are the analytics assistant for NanoAlias, a URL shortener.
Answer the user's question using ONLY the JSON analytics data provided for a single short link.
Rules:
- Be concise: 1-3 sentences. Cite specific numbers and percentages from the data.
- If the data does not contain the answer, say so plainly. Never invent numbers.
- Country codes are ISO-3166 alpha-2 (e.g. "IN" = India, "US" = United States); "unknown" means unresolved.
- Do not mention JSON, fields, or that you were given data. Respond like a human analyst.`;

/**
 * Ask Gemini a natural-language question about a link's analytics.
 *
 * @param {string} question   the user's question
 * @param {object} context    aggregated analytics for a single URL
 * @returns {Promise<{ ok: true, answer: string } | { ok: false, status: number, message: string }>}
 */
exports.askAnalytics = async (question, context) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return {
            ok: false,
            status: 503,
            message: "AI analytics is not configured on the server.",
        };
    }

    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        const res = await fetch(
            `${GEMINI_ENDPOINT}/${model}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                    contents: [
                        {
                            role: "user",
                            parts: [
                                {
                                    text: `Analytics data:\n${JSON.stringify(
                                        context
                                    )}\n\nQuestion: ${question}`,
                                },
                            ],
                        },
                    ],
                    generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
                }),
            }
        );

        if (!res.ok) {
            const body = await res.text().catch(() => "");
            console.error("Gemini API error:", res.status, body.slice(0, 300));

            // 429 = free-tier quota/rate limit exceeded — surface it distinctly.
            if (res.status === 429) {
                return {
                    ok: false,
                    status: 429,
                    message: "AI request limit reached for now. Please try again in a little while.",
                };
            }

            return {
                ok: false,
                status: 502,
                message: "The AI service is temporarily unavailable. Please try again.",
            };
        }

        const data = await res.json();

        // A blocked prompt returns no candidates but a blockReason instead.
        if (data?.promptFeedback?.blockReason) {
            return {
                ok: false,
                status: 400,
                message: "That question couldn't be processed. Try rephrasing it.",
            };
        }

        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!answer) {
            return {
                ok: false,
                status: 502,
                message: "The AI couldn't generate an answer. Please rephrase your question.",
            };
        }

        return { ok: true, answer };
    } catch (err) {
        console.error("Gemini request failed:", err.message);
        return {
            ok: false,
            status: 504,
            message: "The AI request timed out. Please try again.",
        };
    } finally {
        clearTimeout(timeout);
    }
};

const ALIAS_SYSTEM = `You generate short, memorable URL slugs for a link shortener.
Given a destination URL and (optionally) its page title/description, propose 3 candidate slugs.
If the title/description are missing, infer the topic from the URL, the site domain and the keyword hints provided — never refuse; always return 3 slugs.
Rules for every slug:
- 3 to 24 characters
- lowercase letters, numbers and single hyphens only
- no spaces, no leading/trailing hyphen, no consecutive hyphens
- human-readable and clearly related to the destination
- avoid generic filler words like "link", "url", "site", "page", "home"
- Never use opaque alphanumeric IDs, hashes, or random query strings from the URL (e.g. video IDs like "dQw4w9WgXcQ"). Only generate readable, descriptive English words based on the title and context.
Return ONLY a JSON array of exactly 3 distinct strings — a bare array, not an object.
Example: ["stripe-charges","api-charges","stripe-api"]`;

/**
 * Suggest short, human-readable alias slugs for a destination URL.
 *
 * @param {{ url: string, title?: string, description?: string, domain?: string, hints?: string[] }} input
 * @returns {Promise<{ ok: true, suggestions: string[] } | { ok: false, status: number, message: string }>}
 */
exports.suggestAliases = async ({ url, title, description, domain, hints }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return {
            ok: false,
            status: 503,
            message: "AI alias suggestions are not configured on the server.",
        };
    }

    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const context = [
        `URL: ${url}`,
        title ? `Title: ${title}` : "",
        description ? `Description: ${description}` : "",
        domain ? `Site domain: ${domain}` : "",
        hints?.length ? `URL keyword hints: ${hints.join(", ")}` : "",
    ]
        .filter(Boolean)
        .join("\n");

    try {
        const res = await fetch(
            `${GEMINI_ENDPOINT}/${model}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: ALIAS_SYSTEM }] },
                    contents: [{ role: "user", parts: [{ text: context }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 120,
                        responseMimeType: "application/json",
                    },
                }),
            }
        );

        if (!res.ok) {
            const body = await res.text().catch(() => "");
            console.error("Gemini alias error:", res.status, body.slice(0, 300));
            if (res.status === 429) {
                return {
                    ok: false,
                    status: 429,
                    message: "AI request limit reached for now. Please try again shortly.",
                };
            }
            return {
                ok: false,
                status: 502,
                message: "The AI service is temporarily unavailable. Please try again.",
            };
        }

        const data = await res.json();
        if (data?.promptFeedback?.blockReason) {
            return {
                ok: false,
                status: 400,
                message: "Couldn't generate suggestions for this URL.",
            };
        }

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        let arr = [];
        try {
            arr = JSON.parse(text);
        } catch {
            const m = text.match(/\[[\s\S]*\]/);
            if (m) {
                try {
                    arr = JSON.parse(m[0]);
                } catch {
                    /* leave arr empty */
                }
            }
        }
        // JSON mode sometimes wraps the list in an object (e.g. {"slugs": [...]})
        // — previously this was silently discarded, yielding empty suggestions.
        if (!Array.isArray(arr)) {
            if (arr && typeof arr === "object") {
                arr = Object.values(arr).find(Array.isArray) || [];
            } else {
                arr = [];
            }
        }

        return { ok: true, suggestions: arr.map(String) };
    } catch (err) {
        console.error("Gemini alias request failed:", err.message);
        return {
            ok: false,
            status: 504,
            message: "The AI request timed out. Please try again.",
        };
    } finally {
        clearTimeout(timeout);
    }
};
