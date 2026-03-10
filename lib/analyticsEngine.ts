import { NormalizedItem } from "./dataCleaner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toNumber(val: string | undefined): number {
    if (!val) return NaN;
    const n = parseFloat(val.replace(/[^0-9.]/g, ""));
    return isNaN(n) ? NaN : n;
}

function matchesSector(item: NormalizedItem, sector?: string): boolean {
    if (!sector) return true;
    return (item.sector ?? "").toLowerCase() === sector.toLowerCase();
}

// ─── Pipeline Value ───────────────────────────────────────────────────────────

/**
 * Sums masked_deal_value for all open deals, optionally filtered by sector.
 */
export function getPipelineValue(deals: NormalizedItem[], sector?: string): number {
    return deals
        .filter((d) => matchesSector(d, sector))
        .reduce((sum, d) => {
            const val = toNumber(d["masked_deal_value"]);
            return isNaN(val) ? sum : sum + val;
        }, 0);
}

// ─── Deals by Sector ─────────────────────────────────────────────────────────

/**
 * Returns count of deals per sector.
 */
export function getDealsBySector(deals: NormalizedItem[]): Record<string, number> {
    return deals.reduce<Record<string, number>>((acc, d) => {
        const sector = d.sector || "Unknown";
        acc[sector] = (acc[sector] ?? 0) + 1;
        return acc;
    }, {});
}

// ─── Deals by Stage ──────────────────────────────────────────────────────────

/**
 * Returns count of deals per stage, optionally filtered by sector.
 */
export function getDealsByStage(
    deals: NormalizedItem[],
    sector?: string
): Record<string, number> {
    return deals
        .filter((d) => matchesSector(d, sector))
        .reduce<Record<string, number>>((acc, d) => {
            // Try common key names for deal stage
            const stage =
                d["deal_stage"] ||
                d["stage"] ||
                d["crm_stage"] ||
                "Unknown";
            acc[stage] = (acc[stage] ?? 0) + 1;
            return acc;
        }, {});
}

// ─── Revenue Collected ────────────────────────────────────────────────────────

const REVENUE_FIELD = "collected_amount_in_rupees_(incl._of_gst.)_(masked)";

/**
 * Sums collected revenue for closed work orders, optionally filtered by sector.
 */
export function getRevenueCollected(
    workOrders: NormalizedItem[],
    sector?: string
): number {
    return workOrders
        .filter(
            (w) =>
                matchesSector(w, sector) &&
                (w.execution_status ?? "").toLowerCase() === "completed"
        )
        .reduce((sum, w) => {
            const val = toNumber(w[REVENUE_FIELD]);
            return isNaN(val) ? sum : sum + val;
        }, 0);
}

// ─── Operational Load ─────────────────────────────────────────────────────────

/**
 * Counts work orders by execution status.
 */
export function getOperationalLoad(
    workOrders: NormalizedItem[]
): { ongoing: number; completed: number; notStarted: number } {
    const result = { ongoing: 0, completed: 0, notStarted: 0 };

    for (const w of workOrders) {
        const status = (w.execution_status ?? "").toLowerCase();
        if (status === "completed") {
            result.completed += 1;
        } else if (status === "ongoing" || status === "in progress" || status === "active") {
            result.ongoing += 1;
        } else {
            result.notStarted += 1;
        }
    }

    return result;
}

// ─── Top Sector ───────────────────────────────────────────────────────────────

/**
 * Returns the sector with the highest total deal value.
 */
export function getTopSector(deals: NormalizedItem[]): string {
    const totals: Record<string, number> = {};

    for (const deal of deals) {
        const sector = deal.sector || "Unknown";
        const val = toNumber(deal["masked_deal_value"]);
        if (!isNaN(val)) {
            totals[sector] = (totals[sector] ?? 0) + val;
        }
    }

    if (!Object.keys(totals).length) return "Unknown";

    return Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0];
}

// ─── Delayed Projects ─────────────────────────────────────────────────────────

/**
 * Returns work orders that are not completed but whose probable_end_date has passed today.
 */
export function getDelayedProjects(workOrders: NormalizedItem[]): NormalizedItem[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return workOrders.filter((w) => {
        const status = (w.execution_status ?? "").toLowerCase();
        if (status === "completed") return false;

        const rawDate = w["probable_end_date"] || w["end_date"] || w["due_date"];
        if (!rawDate) return false;

        const endDate = new Date(rawDate);
        return !isNaN(endDate.getTime()) && endDate < today;
    });
}
