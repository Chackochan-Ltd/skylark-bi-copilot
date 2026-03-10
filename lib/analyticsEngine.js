// Analytics Engine
// Computes business metrics from normalized Monday.com data

/**
 * Calculate completion rate for a list of items.
 * @param {Array} items - Normalized items
 * @returns {number} Completion percentage (0–100)
 */
export function completionRate(items = []) {
    if (!items.length) return 0;
    const done = items.filter((i) => i.status?.toLowerCase() === "done").length;
    return Math.round((done / items.length) * 100);
}

/**
 * Group items by assignee.
 * @param {Array} items - Normalized items
 * @returns {object} Map of assignee → items[]
 */
export function groupByAssignee(items = []) {
    return items.reduce((acc, item) => {
        const key = item.assignee ?? "Unassigned";
        acc[key] = acc[key] ? [...acc[key], item] : [item];
        return acc;
    }, {});
}

/**
 * Find overdue items (dueDate in the past, not done).
 * @param {Array} items - Normalized items
 * @returns {Array} Overdue items
 */
export function overdueItems(items = []) {
    const today = new Date();
    return items.filter((i) => {
        if (!i.dueDate || i.status?.toLowerCase() === "done") return false;
        return new Date(i.dueDate) < today;
    });
}
