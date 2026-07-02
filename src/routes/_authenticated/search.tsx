import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Search as SearchIcon, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { enrichCompany } from "@/lib/enrichment.functions";
import { PriorityBadge } from "./dashboard";
import { ScoreGauge } from "@/components/ScoreGauge";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({ meta: [{ title: "Search — LeadSphereAI" }] }),
  component: SearchPage,
});

function SearchPage() {
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

  const { data: history } = useQuery({
    queryKey: ["search-history"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return [];
      const { data } = await supabase
        .from("searches")
        .select(
          "id, query, query_type, created_at, companies(id, name, domain, industry, lead_score, lead_grade, priority)",
        )
        .eq("user_id", userRes.user.id)
        .order("created_at", { ascending: false })
        .limit(30);
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
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand">Signal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Search & enrich</h1>
        <p className="mt-2 text-muted-foreground">
          Enter any B2B company name or domain to trigger enrichment.
        </p>
      </header>

      <form onSubmit={submit} className="mb-10">
        <div className="flex items-center rounded-2xl border border-border bg-surface p-2 focus-within:border-brand/60">
          <SearchIcon className="mx-3 size-5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Stripe, notion.so, hubspot.com"
            className="flex-1 bg-transparent px-2 py-3 text-base focus:outline-none"
            disabled={runEnrichment.isPending}
          />
          <button
            type="submit"
            disabled={runEnrichment.isPending || !query.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-brand-foreground disabled:opacity-60"
          >
            {runEnrichment.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Enriching
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> Enrich
              </>
            )}
          </button>
        </div>
      </form>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Search history</h2>
        {history && history.length > 0 ? (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {history.map((row: any) => {
              const c = row.companies;
              return (
                <li key={row.id}>
                  <Link
                    to="/company/$id"
                    params={{ id: c?.id ?? "" }}
                    disabled={!c}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-accent/40"
                  >
                    <ScoreGauge score={c?.lead_score ?? 0} grade={c?.lead_grade} size={56} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold text-foreground">
                          {c?.name ?? row.query}
                        </span>
                        <PriorityBadge priority={c?.priority ?? null} />
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {c?.domain ?? "—"} · {c?.industry ?? "Unknown industry"}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {new Date(row.created_at).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-12 text-center">
            <p className="text-sm text-muted-foreground">No searches yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
