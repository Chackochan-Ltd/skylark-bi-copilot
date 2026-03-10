import { MondayItem } from "./mondayClient";

// ─── Types ───────────────────────────────────────────────────────────────────

export type NormalizedItem = Record<string, string> & { id: string; name: string };

export type CleanResult = {
    data: NormalizedItem[];
    qualityIssues: string[];
};

// ─── Sector Normalization Map ────────────────────────────────────────────────

const SECTOR_MAP: Record<string, string> = {
    energy: "Energy",
    mining: "Mining",
    powerline: "Powerline",
    renewables: "Renewables",
    renewable: "Renewables",
    railways: "Railways",
    railway: "Railways",
    dsp: "DSP",
};

function normalizeSector(raw: string): string {
    if (!raw) return "";
    // Match any key word inside the raw string (case-insensitive)
    const lower = raw.toLowerCase();
    for (const [key, canonical] of Object.entries(SECTOR_MAP)) {
        if (lower.includes(key)) return canonical;
    }
    return raw.trim();
}

// ─── Quantity Cleaning ───────────────────────────────────────────────────────

function stripNonNumeric(raw: string): string {
    const match = raw.replace(/,/g, "").match(/[\d.]+/);
    return match ? match[0] : raw;
}

// ─── Deal Stage Normalization ─────────────────────────────────────────────────
// e.g. "B. Sales Qualified Leads" → "Sales Qualified Leads"

function normalizeDealStage(raw: string): string {
    return raw.replace(/^[A-Z]\.\s*/, "").trim();
}

// ─── Core Normalizer ─────────────────────────────────────────────────────────

export function normalizeItems(items: MondayItem[]): NormalizedItem[] {
    return items.map((item) => {
        const flat: NormalizedItem = { id: item.id, name: item.name };

        for (const col of item.column_values) {
            const key = col.column.title
                .toLowerCase()
                .trim()
                .replace(/\s+/g, "_");
            flat[key] = col.text ?? "";
        }

        return flat;
    });
}

// ─── Clean Work Orders ───────────────────────────────────────────────────────

const QUANTITY_FIELDS = ["quantity", "area", "size", "volume", "qty"];

export function cleanWorkOrders(items: MondayItem[]): CleanResult {
    const normalized = normalizeItems(items);
    const qualityIssues: string[] = [];
    const data: NormalizedItem[] = [];

    for (const item of normalized) {
        const cleaned = { ...item };

        // Normalize sector
        if (cleaned.sector) {
            const original = cleaned.sector;
            cleaned.sector = normalizeSector(original);
            if (cleaned.sector !== original.trim()) {
                qualityIssues.push(
                    `Item "${item.name}" (id:${item.id}): sector normalized from "${original}" → "${cleaned.sector}"`
                );
            }
        } else {
            cleaned.sector = "Unknown";
            qualityIssues.push(`Item "${item.name}" (id:${item.id}): missing sector — set to "Unknown"`);
        }

        // Normalize quantity-like fields
        for (const field of QUANTITY_FIELDS) {
            if (cleaned[field] && /[^\d.]/.test(cleaned[field])) {
                const original = cleaned[field];
                cleaned[field] = stripNonNumeric(original);
                qualityIssues.push(
                    `Item "${item.name}" (id:${item.id}): ${field} stripped from "${original}" → "${cleaned[field]}"`
                );
            }
        }

        // Flag missing execution_status
        if (!cleaned.execution_status) {
            cleaned.execution_status = "Unknown";
            qualityIssues.push(
                `Item "${item.name}" (id:${item.id}): missing execution_status — set to "Unknown"`
            );
        }

        data.push(cleaned);
    }

    return { data, qualityIssues };
}

// ─── Clean Deals ─────────────────────────────────────────────────────────────

export function cleanDeals(items: MondayItem[]): CleanResult {
    const normalized = normalizeItems(items);
    const qualityIssues: string[] = [];
    const data: NormalizedItem[] = [];

    for (const item of normalized) {
        const cleaned = { ...item };

        // Normalize sector
        if (cleaned.sector) {
            const original = cleaned.sector;
            cleaned.sector = normalizeSector(original);
            if (cleaned.sector !== original.trim()) {
                qualityIssues.push(
                    `Deal "${item.name}" (id:${item.id}): sector normalized from "${original}" → "${cleaned.sector}"`
                );
            }
        } else {
            cleaned.sector = "Unknown";
            qualityIssues.push(`Deal "${item.name}" (id:${item.id}): missing sector — set to "Unknown"`);
        }

        // Normalize deal stage (strip letter prefix)
        const stageKey = Object.keys(cleaned).find((k) => k.includes("stage") || k.includes("deal_stage"));
        if (stageKey && cleaned[stageKey]) {
            const original = cleaned[stageKey];
            cleaned[stageKey] = normalizeDealStage(original);
            if (cleaned[stageKey] !== original) {
                qualityIssues.push(
                    `Deal "${item.name}" (id:${item.id}): stage normalized from "${original}" → "${cleaned[stageKey]}"`
                );
            }
        } else if (stageKey && !cleaned[stageKey]) {
            qualityIssues.push(`Deal "${item.name}" (id:${item.id}): missing deal stage`);
        }

        // Flag missing close date
        const closeDateKey = Object.keys(cleaned).find(
            (k) => k.includes("close") || k.includes("closing")
        );
        if (closeDateKey && !cleaned[closeDateKey]) {
            qualityIssues.push(`Deal "${item.name}" (id:${item.id}): missing close date`);
        }

        // Flag missing deal value
        const valueKey = Object.keys(cleaned).find(
            (k) => k.includes("value") || k.includes("amount") || k.includes("deal_value")
        );
        if (valueKey && !cleaned[valueKey]) {
            qualityIssues.push(`Deal "${item.name}" (id:${item.id}): missing deal value`);
        }

        data.push(cleaned);
    }

    return { data, qualityIssues };
}
