// Data Normalization Engine
// Cleans and normalizes raw Monday.com data for downstream processing

/**
 * Normalize raw board items from Monday.com into a consistent shape.
 * @param {Array} items - Raw items array from Monday.com API
 * @returns {Array} Cleaned and normalized items
 */
export function normalizeItems(items = []) {
    return items.map((item) => ({
        id: item.id,
        name: item.name,
        status: item.column_values?.find((c) => c.id === "status")?.text ?? null,
        assignee: item.column_values?.find((c) => c.id === "person")?.text ?? null,
        dueDate: item.column_values?.find((c) => c.id === "date")?.text ?? null,
    }));
}
