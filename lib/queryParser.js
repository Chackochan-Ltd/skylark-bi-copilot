// Query Parser — Intent Extraction
// Identifies the user's intent from a natural language message

const INTENTS = {
    STATUS: ["status", "how is", "progress", "update"],
    OVERDUE: ["overdue", "late", "behind", "delayed"],
    LEADERSHIP: ["report", "executive", "summary", "leadership"],
    ASSIGNEE: ["who is", "assigned to", "owner", "responsible"],
};

/**
 * Extract intent from a user message.
 * @param {string} message - Raw user input
 * @returns {{ intent: string, raw: string }}
 */
export function parseQuery(message = "") {
    const lower = message.toLowerCase();

    for (const [intent, keywords] of Object.entries(INTENTS)) {
        if (keywords.some((kw) => lower.includes(kw))) {
            return { intent, raw: message };
        }
    }

    return { intent: "GENERAL", raw: message };
}
