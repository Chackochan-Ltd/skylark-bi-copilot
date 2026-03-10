import { NextResponse } from "next/server";

import { fetchWorkOrders, fetchDeals } from "@/lib/mondayClient";
import { cleanWorkOrders, cleanDeals } from "@/lib/dataCleaner";

export async function GET(): Promise<NextResponse> {
    try {
        const [rawWorkOrders, rawDeals] = await Promise.all([
            fetchWorkOrders(),
            fetchDeals(),
        ]);

        const { data: workOrders, qualityIssues: woIssues } = cleanWorkOrders(rawWorkOrders);
        const { data: deals, qualityIssues: dealIssues } = cleanDeals(rawDeals);

        return NextResponse.json({
            workOrders,
            deals,
            qualityIssues: [...woIssues, ...dealIssues],
        });
    } catch (error) {
        console.error("GET /api/monday error:", error);
        return NextResponse.json(
            { workOrders: [], deals: [], qualityIssues: [] },
            { status: 500 }
        );
    }
}
