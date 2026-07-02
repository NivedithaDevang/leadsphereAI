import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const OUTREACH_KINDS = [
  "cold_email",
  "linkedin_message",
  "follow_up",
  "sales_pitch",
  "meeting_invitation",
  "intro",
] as const;

const InputSchema = z.object({
  companyId: z.string().uuid(),
  kind: z.enum(OUTREACH_KINDS),
  sender_name: z.string().max(80).optional(),
  sender_product: z.string().max(200).optional(),
});

const kindPrompts: Record<(typeof OUTREACH_KINDS)[number], string> = {
  cold_email: "Write a cold outreach email. Warm opener, 1 insight-based reason for reaching out, 1 crisp CTA. 90-140 words.",
  linkedin_message: "Write a LinkedIn-style connection message. No LinkedIn scraping used. Short, personal, non-salesy. Under 300 characters.",
  follow_up: "Write a polite follow-up email (assuming no reply to a prior message). 60-100 words. New angle, no guilt.",
  sales_pitch: "Write a compact 3-paragraph sales pitch tailored to this company's known context. Under 200 words.",
  meeting_invitation: "Write a short email inviting a decision-maker to a 20-minute discovery call. Include 2 tentative time slots. 80-120 words.",
  intro: "Write a warm personalized intro paragraph a rep could use to open a call.",
};

/**
 * Generate an outreach draft for a given saved company.
 */
export const generateOutreach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: company, error } = await supabase
      .from("companies")
      .select(
        "name, domain, industry, hq, employees, description, ai_summary, tech_stack, strengths, opportunities, recommendation, priority",
      )
      .eq("id", data.companyId)
      .single();

    if (error || !company) throw new Error("Company not found");

    const { callAiGateway } = await import("@/lib/ai-gateway.server");

    const system = `You write high-conviction B2B outreach for a sales rep at LeadSphereAI's customer.

Return ONLY JSON:
{
  "subject": string,   // omit for LinkedIn-style — return empty string
  "body": string       // the outreach copy, ready to paste
}

Rules:
- Never fabricate the recipient's name — use a placeholder like "there" or "team".
- Reference at least one concrete signal from the context (funding, hiring, tech stack, expansion).
- No emojis. No exclamation-point spam. No "I hope this email finds you well".
- Sound like a sharp analyst who did their homework, not a boilerplate blaster.`;

    const context_str = `Company context:
- Name: ${company.name}
- Domain: ${company.domain ?? "unknown"}
- Industry: ${company.industry ?? "unknown"}
- HQ: ${company.hq ?? "unknown"}
- Employees: ${company.employees ?? "unknown"}
- Description: ${company.description ?? ""}
- Summary: ${company.ai_summary ?? ""}
- Tech: ${(company.tech_stack ?? []).join(", ")}
- Strengths: ${(company.strengths ?? []).join("; ")}
- Opportunities: ${(company.opportunities ?? []).join("; ")}
- Priority: ${company.priority ?? "Medium"}

Sender:
- Name: ${data.sender_name ?? "Alex from LeadSphereAI"}
- Product: ${data.sender_product ?? "LeadSphereAI — predictive B2B revenue intelligence"}

Task: ${kindPrompts[data.kind]}`;

    const result = await callAiGateway<{ subject: string; body: string }>({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: context_str },
      ],
      temperature: 0.75,
    });

    const { data: draft, error: draftError } = await supabase
      .from("outreach_drafts")
      .insert({
        user_id: userId,
        company_id: data.companyId,
        kind: data.kind,
        subject: result.subject ?? null,
        body: result.body,
      })
      .select("id, subject, body, kind, created_at")
      .single();

    if (draftError) throw new Error(draftError.message);
    return draft;
  });
