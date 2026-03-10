// Monday.com GraphQL Client
// Centralizes all Monday.com API queries

const MONDAY_API_URL = "https://api.monday.com/v2";

/**
 * Run a GraphQL query against the Monday.com API.
 * @param {string} query - GraphQL query string
 * @param {object} variables - Query variables
 */
export async function mondayQuery(query, variables = {}) {
    const response = await fetch(MONDAY_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: process.env.MONDAY_API_KEY,
        },
        body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
        throw new Error(`Monday.com API error: ${response.statusText}`);
    }

    return response.json();
}
