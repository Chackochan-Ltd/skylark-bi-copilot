const MONDAY_API_URL = "https://api.monday.com/v2";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ColumnValue = {
    id: string;
    text: string;
    column: { title: string };
};

export type MondayItem = {
    id: string;
    name: string;
    column_values: ColumnValue[];
};

// ─── Core GraphQL Fetcher ────────────────────────────────────────────────────

export async function mondayQuery(
    query: string,
    variables: object = {}
): Promise<unknown> {
    const token = process.env.MONDAY_API_TOKEN;
    if (!token) throw new Error("Missing MONDAY_API_TOKEN in environment.");

    const res = await fetch(MONDAY_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: token,
            "API-Version": "2024-01",
        },
        body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
        throw new Error(`Monday.com API error: ${res.status} ${res.statusText}`);
    }

    const json = (await res.json()) as { data?: unknown; errors?: unknown[] };

    if (json.errors?.length) {
        console.error("Monday.com GraphQL errors:", json.errors);
        throw new Error("Monday.com returned GraphQL errors — see console.");
    }

    return json.data;
}

// ─── Shared Board Items Query ────────────────────────────────────────────────

const BOARD_ITEMS_QUERY = /* GraphQL */ `
  query GetBoardItems($boardId: ID!) {
    boards(ids: [$boardId]) {
      items_page {
        items {
          id
          name
          column_values {
            id
            text
            column {
              title
            }
          }
        }
      }
    }
  }
`;

type BoardResponse = {
    boards: { items_page: { items: MondayItem[] } }[];
};

async function fetchBoardItems(boardId: string): Promise<MondayItem[]> {
    const data = (await mondayQuery(BOARD_ITEMS_QUERY, { boardId })) as BoardResponse;
    return data?.boards?.[0]?.items_page?.items ?? [];
}

// ─── Public Fetchers ─────────────────────────────────────────────────────────

export async function fetchWorkOrders(): Promise<MondayItem[]> {
    const boardId = process.env.MONDAY_WORK_ORDERS_BOARD_ID;
    if (!boardId) throw new Error("Missing MONDAY_WORK_ORDERS_BOARD_ID in environment.");
    try {
        return await fetchBoardItems(boardId);
    } catch (err) {
        console.error("fetchWorkOrders error:", err);
        return [];
    }
}

export async function fetchDeals(): Promise<MondayItem[]> {
    const boardId = process.env.MONDAY_DEALS_BOARD_ID;
    if (!boardId) throw new Error("Missing MONDAY_DEALS_BOARD_ID in environment.");
    try {
        return await fetchBoardItems(boardId);
    } catch (err) {
        console.error("fetchDeals error:", err);
        return [];
    }
}
