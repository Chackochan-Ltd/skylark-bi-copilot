// ─── Types ───────────────────────────────────────────────────────────────────

export type Intent =
    | "pipeline"
    | "revenue"
    | "deals_by_sector"
    | "deals_by_stage"
    | "operational_load"
    | "delayed_projects"
    | "top_sector"
    | "leadership_update"
    | "unknown";

export type ParsedQuery = {
    intent: Intent;
    sector?: string;
    metric?: string;
    timeframe?: string;
};

// ─── Keyword Maps ─────────────────────────────────────────────────────────────

const SECTOR_KEYWORDS: Record<string, string> = {
    mining: "Mining",
    powerline: "Powerline",
    renewables: "Renewables",
    renewable: "Renewables",
    railways: "Railways",
    railway: "Railways",
    energy: "Energy",
    dsp: "DSP",
};

const TIMEFRAME_PATTERNS: [RegExp, string][] = [
    [/this\s+quarter/i, "this quarter"],
    [/this\s+month/i, "this month"],
    [/this\s+year/i, "this year"],
    [/\bq1\b/i, "Q1"],
    [/\bq2\b/i, "Q2"],
    [/\bq3\b/i, "Q3"],
    [/\bq4\b/i, "Q4"],
];

const METRIC_KEYWORDS: Record<string, string> = {
    pipeline: "pipeline",
    revenue: "revenue",
    deals: "deals",
    performance: "performance",
    status: "status",
    load: "load",
};

// Intent detection: ordered from most specific to least specific
const INTENT_PATTERNS: [RegExp, Intent][] = [
    [/leadership|executive|report|summary/i, "leadership_update"],
    [/delay|overdue|behind|late|missed/i, "delayed_projects"],
    [/top\s+sector|best\s+sector|highest/i, "top_sector"],
    [/by\s+stage|per\s+stage|stage\s+breakdown|stage\s+split/i, "deals_by_stage"],
    [/by\s+sector|per\s+sector|sector\s+breakdown|sector\s+split/i, "deals_by_sector"],
    [/operational|workload|work\s+order|capacity|load/i, "operational_load"],
    [/revenue|collected|invoiced|billed/i, "revenue"],
    [/pipeline|deal\s+value|total\s+value|deal/i, "pipeline"],
];

// ─── Main Parser ──────────────────────────────────────────────────────────────

export function parseQuery(message: string): ParsedQuery {
    const lower = message.toLowerCase();

    // Detect intent (first match wins)
    let intent: Intent = "unknown";
    for (const [pattern, candidate] of INTENT_PATTERNS) {
        if (pattern.test(lower)) {
            intent = candidate;
            break;
        }
    }

    // Detect sector
    let sector: string | undefined;
    for (const [keyword, canonical] of Object.entries(SECTOR_KEYWORDS)) {
        if (lower.includes(keyword)) {
            sector = canonical;
            break;
        }
    }

    // Detect timeframe
    let timeframe: string | undefined;
    for (const [pattern, label] of TIMEFRAME_PATTERNS) {
        if (pattern.test(lower)) {
            timeframe = label;
            break;
        }
    }

    // Detect metric
    let metric: string | undefined;
    for (const [keyword, canonical] of Object.entries(METRIC_KEYWORDS)) {
        if (lower.includes(keyword)) {
            metric = canonical;
            break;
        }
    }

    return { intent, ...(sector && { sector }), ...(metric && { metric }), ...(timeframe && { timeframe }) };
}
