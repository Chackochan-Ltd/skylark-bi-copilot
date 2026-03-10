import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

import { fetchWorkOrders, fetchDeals } from "@/lib/mondayClient";
import { cleanWorkOrders, cleanDeals } from "@/lib/dataCleaner";
import { parseQuery } from "@/lib/queryParser";
import {
    getPipelineValue,
    getDealsBySector,
    getDealsByStage,
    getRevenueCollected,
    getOperationalLoad,
    getTopSector,
    getDelayedProjects,
} from "@/lib/analyticsEngine";

// ─── Groq Setup ──────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Skylark BI Copilot, an AI business intelligence assistant for Skylark Drones leadership. You receive structured analytics data and answer founder-level business questions in a concise, executive tone. Always include: key metric, insight, and one recommendation. Format with clear sections. Mention data quality issues if any.`;

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const body = await req.json();
        const message: string = body?.message ?? "";

        if (!message.trim()) {
            return NextResponse.json(
                { reply: "Please provide a message.", qualityIssues: [] },
                { status: 400 }
            );
        }

        // 1. Fetch raw data from Monday.com
        const [rawWorkOrders, rawDeals] = await Promise.all([
            fetchWorkOrders(),
            fetchDeals(),
        ]);

        // 2. Clean and normalize data
        const { data: workOrders, qualityIssues: woIssues } = cleanWorkOrders(rawWorkOrders);
        const { data: deals, qualityIssues: dealIssues } = cleanDeals(rawDeals);
        const qualityIssues = [...woIssues, ...dealIssues];

        // 3. Parse user intent
        const { intent, sector, timeframe } = parseQuery(message);

        // 4. Compute analytics based on intent
        let analyticsData: unknown;

        switch (intent) {
            case "pipeline":
                analyticsData = {
                    intent,
                    sector,
                    pipelineValue: getPipelineValue(deals, sector),
                };
                break;

            case "deals_by_sector":
                analyticsData = {
                    intent,
                    dealsBySector: getDealsBySector(deals),
                };
                break;

            case "deals_by_stage":
                analyticsData = {
                    intent,
                    sector,
                    dealsByStage: getDealsByStage(deals, sector),
                };
                break;

            case "revenue":
                analyticsData = {
                    intent,
                    sector,
                    revenueCollected: getRevenueCollected(workOrders, sector),
                };
                break;

            case "operational_load":
                analyticsData = {
                    intent,
                    operationalLoad: getOperationalLoad(workOrders),
                };
                break;

            case "top_sector":
                analyticsData = {
                    intent,
                    topSector: getTopSector(deals),
                };
                break;

            case "delayed_projects":
                analyticsData = {
                    intent,
                    delayedProjects: getDelayedProjects(workOrders).map((w) => ({
                        id: w.id,
                        name: w.name,
                        status: w.execution_status,
                        dueDate: w.probable_end_date ?? w.end_date ?? w.due_date,
                        sector: w.sector,
                    })),
                };
                break;

            case "leadership_update":
            default:
                // Full snapshot for leadership or unknown queries
                analyticsData = {
                    intent,
                    sector,
                    timeframe,
                    pipelineValue: getPipelineValue(deals, sector),
                    revenueCollected: getRevenueCollected(workOrders, sector),
                    topSector: getTopSector(deals),
                    operationalLoad: getOperationalLoad(workOrders),
                    dealsBySector: getDealsBySector(deals),
                    dealsByStage: getDealsByStage(deals, sector),
                    delayedProjectCount: getDelayedProjects(workOrders).length,
                    qualityIssueCount: qualityIssues.length,
                };
                break;
        }

        // 5. Call Groq
        const prompt = `
User question: ${message}

Analytics data:
${JSON.stringify(analyticsData, null, 2)}

${qualityIssues.length > 0 ? `Data quality issues detected (${qualityIssues.length} total):\n${qualityIssues.slice(0, 10).join("\n")}` : "No data quality issues detected."}
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
        const reply = completion.choices[0]?.message?.content ?? "No response";

        return NextResponse.json({ reply, qualityIssues });
    } catch (error) {
        console.error("Chat route error:", error);
        return NextResponse.json(
            { reply: "Something went wrong. Please try again later.", qualityIssues: [] },
            { status: 500 }
        );
    }
}
