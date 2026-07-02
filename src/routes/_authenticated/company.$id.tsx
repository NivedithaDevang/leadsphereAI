import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Copy,
  Loader2,
  Mail,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScoreGauge } from "@/components/ScoreGauge";
import { PriorityBadge } from "./dashboard";
import { generateOutreach } from "@/lib/outreach.functions";

export const Route = createFileRoute("/_authenticated/company/$id")({
  head: () => ({ meta: [{ title: "Company — LeadSphereAI" }] }),
  component: CompanyDetail,
});

const OUTREACH_KINDS = [
  { value: "cold_email", label: "Cold Email" },
  { value: "linkedin_message", label: "LinkedIn-style DM" },
  { value: "follow_up", label: "Follow-up" },
  { value: "sales_pitch", label: "Sales Pitch" },
  { value: "meeting_invitation", label: "Meeting Invite" },
  { value: "intro", label: "Warm Intro" },
] as const;

function CompanyDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [outreachKind, setOutreachKind] = useState<(typeof OUTREACH_KINDS)[number]["value"]>("cold_email");
  const generate = useServerFn(generateOutreach);

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: saved } = useQuery({
    queryKey: ["saved", id],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return null;
      const { data } = await supabase
        .from("saved_leads")
        .select("id")
        .eq("user_id", userRes.user.id)
        .eq("company_id", id)
        .maybeSingle();
      return data;
    },
  });

  const { data: drafts } = useQuery({
    queryKey: ["drafts", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("outreach_drafts")
        .select("id, kind, subject, body, created_at")
        .eq("company_id", id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const toggleSave = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) throw new Error("Not signed in");
      if (saved) {
        await supabase.from("saved_leads").delete().eq("id", saved.id);
      } else {
        await supabase.from("saved_leads").insert({ user_id: userRes.user.id, company_id: id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success(saved ? "Lead removed" : "Lead saved");
    },
  });

  const outreach = useMutation({
    mutationFn: async () => generate({ data: { companyId: id, kind: outreachKind } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts", id] });
      toast.success("Draft generated");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to generate"),
  });

  if (isLoading || !company) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  const breakdown = (company.score_breakdown ?? {}) as Record<string, number>;
  const breakdownEntries = Object.entries(breakdown);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-brand"
      >
        <ArrowLeft className="size-3" /> Back to dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col justify-between gap-6 rounded-2xl border border-border bg-surface p-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-background text-xl font-bold text-foreground">
            {company.name[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {company.domain && (
                <a
                  href={`https://${company.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-brand"
                >
                  {company.domain} <ExternalLink className="size-3" />
                </a>
              )}
              {company.hq && <span>· {company.hq}</span>}
              {company.industry && <span>· {company.industry}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Priority
            </p>
            <div className="mt-1">
              <PriorityBadge priority={company.priority} />
            </div>
          </div>
          <ScoreGauge score={company.lead_score ?? 0} grade={company.lead_grade} size={100} />
          <button
            onClick={() => toggleSave.mutate()}
            disabled={toggleSave.isPending}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
              saved
                ? "bg-brand text-brand-foreground"
                : "border border-border bg-surface hover:bg-accent"
            }`}
          >
            {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-8">
          {/* AI Summary */}
          <Panel title="AI Company Summary">
            <p className="leading-relaxed text-foreground/90">{company.ai_summary}</p>
            {company.description && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {company.description}
              </p>
            )}
          </Panel>

          {/* Score breakdown */}
          {breakdownEntries.length > 0 && (
            <Panel title="Score Reasoning">
              {company.score_reasoning && (
                <p className="mb-6 text-sm leading-relaxed text-foreground/80">
                  {company.score_reasoning}
                </p>
              )}
              <div className="space-y-3">
                {breakdownEntries.map(([label, value]) => (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="capitalize text-muted-foreground">
                        {label.replace(/_/g, " ")}
                      </span>
                      <span className="font-mono text-foreground">{value}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-brand transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, Number(value)))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* Analysis lists */}
          <div className="grid gap-6 sm:grid-cols-2">
            <ListPanel title="Strengths" items={company.strengths} tone="positive" />
            <ListPanel title="Opportunities" items={company.opportunities} tone="brand" />
            <ListPanel title="Weaknesses" items={company.weaknesses} tone="neutral" />
            <ListPanel title="Challenges" items={company.challenges} tone="warning" />
          </div>

          {/* Recommendation */}
          {company.recommendation && (
            <Panel title="AI Recommendation">
              <p className="leading-relaxed text-foreground/90">{company.recommendation}</p>
            </Panel>
          )}

          {/* Outreach generator */}
          <Panel
            title="Outreach Studio"
            action={
              <button
                onClick={() => outreach.mutate()}
                disabled={outreach.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-brand-foreground disabled:opacity-60"
              >
                {outreach.isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Sparkles className="size-3" />
                )}
                Generate
              </button>
            }
          >
            <div className="mb-4 flex flex-wrap gap-2">
              {OUTREACH_KINDS.map((k) => (
                <button
                  key={k.value}
                  onClick={() => setOutreachKind(k.value)}
                  className={`rounded-full px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${
                    outreachKind === k.value
                      ? "bg-brand text-brand-foreground"
                      : "border border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>

            {drafts && drafts.length > 0 ? (
              <div className="space-y-4">
                {drafts.map((d) => (
                  <DraftCard key={d.id} draft={d} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-background/40 p-8 text-center">
                <Mail className="mx-auto size-6 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Pick a template and hit Generate.
                </p>
              </div>
            )}
          </Panel>
        </div>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-4">
          <Panel title="Firmographics">
            <dl className="space-y-3 text-sm">
              <Row label="Founded" value={company.founded_year} />
              <Row label="Employees" value={company.employees} />
              <Row label="Revenue" value={company.revenue} />
              <Row label="Business Model" value={company.business_model} />
              <Row
                label="Conversion Prob."
                value={
                  company.conversion_probability != null
                    ? `${company.conversion_probability}%`
                    : null
                }
              />
              <Row label="Target Customers" value={company.target_customers} />
            </dl>
          </Panel>

          <Panel title="Tech Stack">
            {company.tech_stack && company.tech_stack.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {company.tech_stack.map((t: string) => (
                  <span
                    key={t}
                    className="rounded-md border border-border bg-background/60 px-2.5 py-1 font-mono text-xs text-foreground/80"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tech signals detected.</p>
            )}
          </Panel>

          <Panel title="Recent News">
            {company.recent_news && Array.isArray(company.recent_news) && company.recent_news.length > 0 ? (
              <ul className="space-y-3">
                {(company.recent_news as Array<{ headline: string; sentiment: string }>).map(
                  (n, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 border-l-2 border-border pl-3"
                      style={{ borderColor: sentimentBorder(n.sentiment) }}
                    >
                      <p className="text-sm text-foreground/90">{n.headline}</p>
                    </li>
                  ),
                )}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No recent news signals.</p>
            )}
          </Panel>

          {company.products && company.products.length > 0 && (
            <Panel title="Products">
              <ul className="space-y-1 text-sm text-foreground/90">
                {company.products.map((p: string) => (
                  <li key={p}>· {p}</li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <span className="size-1.5 rounded-full bg-brand" />
          {title}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ListPanel({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[] | null;
  tone: "positive" | "brand" | "neutral" | "warning";
}) {
  const dot = {
    positive: "bg-success",
    brand: "bg-brand",
    neutral: "bg-muted-foreground",
    warning: "bg-warning",
  }[tone];
  return (
    <Panel title={title}>
      {items && items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it} className="flex items-start gap-2 text-sm text-foreground/90">
              <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${dot}`} />
              {it}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">—</p>
      )}
    </Panel>
  );
}

function Row({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="text-right text-sm text-foreground">
        {value != null && value !== "" ? String(value) : "—"}
      </dd>
    </div>
  );
}

function DraftCard({
  draft,
}: {
  draft: { id: string; kind: string; subject: string | null; body: string; created_at: string };
}) {
  const copy = () => {
    const text = draft.subject ? `Subject: ${draft.subject}\n\n${draft.body}` : draft.body;
    void navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };
  return (
    <article className="rounded-xl border border-border bg-background/60 p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-brand">
          {draft.kind.replace(/_/g, " ")}
        </span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1 font-mono text-[10px] font-bold uppercase text-muted-foreground hover:bg-accent"
        >
          <Copy className="size-3" /> Copy
        </button>
      </div>
      {draft.subject && (
        <p className="mb-2 text-sm font-semibold text-foreground">
          <span className="text-brand/70">Subject:</span> {draft.subject}
        </p>
      )}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
        {draft.body}
      </p>
    </article>
  );
}

function sentimentBorder(sentiment: string): string {
  if (sentiment === "positive") return "oklch(0.75 0.18 155)";
  if (sentiment === "negative") return "oklch(0.65 0.22 25)";
  return "oklch(0.28 0.03 260)";
}
