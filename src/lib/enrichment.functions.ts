import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  query: z.string().min(1).max(200),
});

interface EnrichedCompanyPayload {
  name: string;
  domain: string | null;
  industry: string | null;
  hq: string | null;
  founded_year: number | null;
  employees: string | null;
  revenue: string | null;
  description: string | null;
  tech_stack: string[];
  products: string[];
  services: string[];
  social_links: Record<string, string>;
  recent_news: Array<{ headline: string; sentiment: "positive" | "neutral" | "negative" }>;
  news_sentiment: "positive" | "neutral" | "negative";
  ai_summary: string;
  business_model: string;
  target_customers: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  challenges: string[];
  recommendation: string;
  lead_score: number;
  lead_grade: string;
  conversion_probability: number;
  priority: string;
  score_reasoning: string;
  score_breakdown: Record<string, number>;
}

/**
 * Enrich a company from name or domain.
 *
 * Runs the LLM once with a strict JSON contract, then upserts the resulting
 * company row plus a search history entry — all as the signed-in user.
 */
export const enrichCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const query = data.query.trim();
    const isDomain = /\.[a-z]{2,}/i.test(query);

    const { callAiGateway } = await import("@/lib/ai-gateway.server");

    const system = `You are LeadSphereAI, a B2B revenue-intelligence analyst. Given a company NAME or DOMAIN, produce a rigorous enriched profile using only publicly known information.

Return ONLY a valid JSON object with this exact shape and keys:
{
  "name": string,
  "domain": string | null,
  "industry": string | null,
  "hq": string | null,
  "founded_year": number | null,
  "employees": string | null,          // e.g. "50-200"
  "revenue": string | null,            // e.g. "$10M-$50M" or null if unknown
  "description": string,               // 1-2 sentence company description
  "tech_stack": string[],              // 4-10 items, best guess for well-known companies
  "products": string[],                // 2-6 items
  "services": string[],                // 0-5 items
  "social_links": { "linkedin"?: string, "twitter"?: string, "github"?: string },
  "recent_news": [{"headline": string, "sentiment": "positive"|"neutral"|"negative"}], // 2-4 items
  "news_sentiment": "positive"|"neutral"|"negative",
  "ai_summary": string,                // 2-3 sentence executive summary
  "business_model": string,            // "SaaS", "Marketplace", "Consulting", etc.
  "target_customers": string,          // one sentence
  "strengths": string[],               // 3-5 items
  "weaknesses": string[],              // 2-4 items
  "opportunities": string[],           // 3-5 items
  "challenges": string[],              // 2-4 items
  "recommendation": string,            // outreach recommendation, 1-2 sentences
  "lead_score": number,                // 0-100 integer
  "lead_grade": string,                // "A+", "A", "B", "C", "D", "F"
  "conversion_probability": number,    // 0-100 integer
  "priority": "Critical"|"High"|"Medium"|"Low",
  "score_reasoning": string,           // 2-4 sentence explanation
  "score_breakdown": {                 // each 0-100, contribution to overall score
    "industry_fit": number,
    "company_size": number,
    "growth_signals": number,
    "tech_adoption": number,
    "online_presence": number,
    "news_sentiment": number
  }
}

Do not invent numbers you don't know — use plausible ranges (e.g. "10-50", "$1M-$5M") and null when truly unknown. For unknown companies, note that in description and produce reasonable estimates with lower confidence in the score.`;

    const userPrompt = `Enrich this ${isDomain ? "domain" : "company"}: "${query}"`;

    const enriched = await callAiGateway<EnrichedCompanyPayload>({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
    });

    // Persist company row.
    const { data: company, error: insertError } = await supabase
      .from("companies")
      .insert({
        created_by: userId,
        name: enriched.name,
        domain: enriched.domain,
        industry: enriched.industry,
        hq: enriched.hq,
        founded_year: enriched.founded_year,
        employees: enriched.employees,
        revenue: enriched.revenue,
        description: enriched.description,
        tech_stack: enriched.tech_stack ?? [],
        products: enriched.products ?? [],
        services: enriched.services ?? [],
        social_links: enriched.social_links ?? {},
        recent_news: enriched.recent_news ?? [],
        news_sentiment: enriched.news_sentiment,
        ai_summary: enriched.ai_summary,
        business_model: enriched.business_model,
        target_customers: enriched.target_customers,
        strengths: enriched.strengths ?? [],
        weaknesses: enriched.weaknesses ?? [],
        opportunities: enriched.opportunities ?? [],
        challenges: enriched.challenges ?? [],
        recommendation: enriched.recommendation,
        lead_score: enriched.lead_score,
        lead_grade: enriched.lead_grade,
        conversion_probability: enriched.conversion_probability,
        priority: enriched.priority,
        score_reasoning: enriched.score_reasoning,
        score_breakdown: enriched.score_breakdown ?? {},
      })
      .select("id")
      .single();

    if (insertError) throw new Error(insertError.message);

    // Log search history.
    await supabase.from("searches").insert({
      user_id: userId,
      company_id: company.id,
      query,
      query_type: isDomain ? "domain" : "company",
    });

    return { companyId: company.id };
  });
