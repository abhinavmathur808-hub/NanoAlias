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
