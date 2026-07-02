import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Search as SearchIcon, ArrowUpRight, Loader2, Sparkles, TrendingUp, Clock, Bookmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { enrichCompany } from "@/lib/enrichment.functions";
import { ScoreGauge } from "@/components/ScoreGauge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LeadSphereAI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const enrich = useServerFn(enrichCompany);

  const runEnrichment = useMutation({
    mutationFn: async (q: string) => await enrich({ data: { query: q } }),
    onSuccess: (res) => {
      toast.success("Company enriched");
      navigate({ to: "/company/$id", params: { id: res.companyId } });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Enrichment failed"),
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return null;
      const uid = userRes.user.id;

      const [searchesQ, savedQ, avgScoreQ, criticalQ] = await Promise.all([
        supabase.from("searches").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("saved_leads").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("archived", false),
        supabase.from("companies").select("lead_score").eq("created_by", uid),
        supabase.from("companies").select("id", { count: "exact", head: true }).eq("created_by", uid).gte("lead_score", 85),
      ]);

      const scores = (avgScoreQ.data ?? []).map((r) => r.lead_score).filter((n): n is number => typeof n === "number");
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      return {
        totalSearches: searchesQ.count ?? 0,
        savedLeads: savedQ.count ?? 0,
        criticalLeads: criticalQ.count ?? 0,
        avgScore: avg,
      };
    },
  });

  const { data: recentCompanies } = useQuery({
    queryKey: ["recent-companies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, domain, industry, lead_score, lead_grade, priority, hq, created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    runEnrichment.mutate(trimmed);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand">Command Center</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Enrich any B2B company. Score, summarize, and draft outreach in one pass.
        </p>
      </header>

      {/* Enrich bar */}
      <form onSubmit={submit} className="relative mb-10">
        <div className="flex items-center rounded-2xl border border-border bg-surface p-2 shadow-2xl shadow-brand/5 focus-within:border-brand/60">
          <SearchIcon className="mx-3 size-5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Company name or domain — e.g. Stripe or notion.so"
            className="flex-1 bg-transparent px-2 py-3 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            disabled={runEnrichment.isPending}
          />
          <button
            type="submit"
            disabled={runEnrichment.isPending || !query.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-brand-foreground transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {runEnrichment.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enriching
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Enrich
              </>
            )}
          </button>
        </div>
      </form>

      {/* Stats grid */}
      <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Searches"
          value={stats?.totalSearches ?? 0}
          icon={SearchIcon}
        />
        <StatCard label="Saved Leads" value={stats?.savedLeads ?? 0} icon={Bookmark} />
        <StatCard
          label="Critical Priority"
          value={stats?.criticalLeads ?? 0}
          icon={TrendingUp}
          accent
        />
        <StatCard label="Avg Score" value={stats?.avgScore ?? 0} icon={Sparkles} />
      </section>

      {/* Recent companies */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent enrichments</h2>
          <Link
            to="/analytics"
            className="text-sm font-medium text-brand hover:underline"
          >
            View analytics →
          </Link>
        </div>

        {recentCompanies && recentCompanies.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentCompanies.map((c) => (
              <Link
                key={c.id}
                to="/company/$id"
                params={{ id: c.id }}
                className="group flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 transition-all hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5"
              >
                <ScoreGauge score={c.lead_score ?? 0} grade={c.lead_grade} size={72} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-foreground">{c.name}</h3>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.domain ?? "—"} · {c.industry ?? "Unknown industry"}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <PriorityBadge priority={c.priority} />
                    {c.hq && (
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {c.hq}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        accent ? "border-brand/40 bg-brand-soft" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <Icon className={`size-4 ${accent ? "text-brand" : "text-muted-foreground"}`} />
      </div>
      <p
        className={`mt-3 font-mono text-3xl font-bold ${accent ? "text-brand" : "text-foreground"}`}
        style={{ fontFeatureSettings: '"tnum"' }}
      >
        {value}
      </p>
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: string | null }) {
  const p = priority ?? "Medium";
  const styles: Record<string, string> = {
    Critical: "bg-brand text-brand-foreground",
    High: "bg-brand/20 text-brand",
    Medium: "border border-border bg-surface text-muted-foreground",
    Low: "border border-border bg-surface text-muted-foreground",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest ${styles[p] ?? styles.Medium}`}
    >
      {p}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-12 text-center">
      <Clock className="mx-auto size-8 text-muted-foreground" />
      <h3 className="mt-4 font-semibold text-foreground">No searches yet</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Type a company name or domain above to enrich your first lead.
      </p>
    </div>
  );
}
