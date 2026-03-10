import { NextResponse } from "next/server";
import Groq from "groq-sdk";

import { fetchWorkOrders, fetchDeals } from "@/lib/mondayClient";
import { cleanWorkOrders, cleanDeals } from "@/lib/dataCleaner";
import {
    getPipelineValue,
    getDealsBySector,
    getDealsByStage,
    getRevenueCollected,
    getOperationalLoad,
    getTopSector,
    getDelayedProjects,
} from "@/lib/analyticsEngine";

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Skylark BI Copilot. Generate a concise Weekly Leadership Update for Skylark Drones founders. Use this structure: Revenue Closed, Pipeline Value, Top Performing Sector, Operational Status, Delayed Projects, Data Quality Notes, and one Strategic Recommendation. Be executive, specific, and data-driven.`;

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(): Promise<NextResponse> {
    try {
        // 1. Fetch raw data
        const [rawWorkOrders, rawDeals] = await Promise.all([
            fetchWorkOrders(),
            fetchDeals(),
        ]);

        // 2. Clean and normalize
        const { data: workOrders, qualityIssues: woIssues } = cleanWorkOrders(rawWorkOrders);
        const { data: deals, qualityIssues: dealIssues } = cleanDeals(rawDeals);
        const qualityIssues = [...woIssues, ...dealIssues];

        // 3. Compute full analytics snapshot
        const delayed = getDelayedProjects(workOrders);
        const snapshot = {
            revenueCollected: getRevenueCollected(workOrders),
            pipelineValue: getPipelineValue(deals),
            topSector: getTopSector(deals),
            operationalLoad: getOperationalLoad(workOrders),
            dealsBySector: getDealsBySector(deals),
            dealsByStage: getDealsByStage(deals),
            delayedProjects: delayed.map((w) => ({
                id: w.id,
                name: w.name,
                sector: w.sector,
                status: w.execution_status,
                dueDate: w.probable_end_date ?? w.end_date ?? w.due_date,
            })),
            totalWorkOrders: workOrders.length,
            totalDeals: deals.length,
            dataQualityIssueCount: qualityIssues.length,
        };

        // 4. Call Groq
        const prompt = `
Generate the Weekly Leadership Update based on the following data snapshot:

${JSON.stringify(snapshot, null, 2)}

${qualityIssues.length > 0
                ? `Data Quality Issues (${qualityIssues.length} total — top 10 shown):\n${qualityIssues.slice(0, 10).join("\n")}`
                : "No data quality issues detected."
            }
    `.trim();

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: prompt },
            ],
            max_tokens: 1024,
        });
        const report = completion.choices[0]?.message?.content ?? "No response";

        return NextResponse.json({ report, qualityIssues });
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("Leadership route error:", msg);
        return NextResponse.json(
            { report: `Debug error: ${msg}`, qualityIssues: [] },
            { status: 500 }
        );
    }
}
