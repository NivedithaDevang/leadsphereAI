import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Bookmark, Download, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScoreGauge } from "@/components/ScoreGauge";
import { PriorityBadge } from "./dashboard";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({ meta: [{ title: "Saved Leads — LeadSphereAI" }] }),
  component: SavedLeads,
});

function SavedLeads() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const { data: leads } = useQuery({
    queryKey: ["saved-leads", showArchived],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return [];
      const { data } = await supabase
        .from("saved_leads")
        .select(
          "id, tags, notes, archived, created_at, companies(id, name, domain, industry, hq, lead_score, lead_grade, priority)",
        )
        .eq("user_id", userRes.user.id)
        .eq("archived", showArchived)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const toggleArchive = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      await supabase.from("saved_leads").update({ archived: !archived }).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-leads"] });
      toast.success("Updated");
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("saved_leads").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Removed");
    },
  });

  const filtered = (leads ?? []).filter((l: any) => {
    if (!filter) return true;
    const f = filter.toLowerCase();
    const c = l.companies;
    return (
      c?.name?.toLowerCase().includes(f) ||
      c?.domain?.toLowerCase().includes(f) ||
      c?.industry?.toLowerCase().includes(f)
    );
  });

  const exportCsv = () => {
    const rows = filtered.map((l: any) => l.companies).filter(Boolean);
    if (!rows.length) {
      toast.error("Nothing to export");
      return;
    }
    const header = ["Name", "Domain", "Industry", "HQ", "Score", "Grade", "Priority"];
    const csv = [
      header.join(","),
      ...rows.map((c: any) =>
        [c.name, c.domain, c.industry, c.hq, c.lead_score, c.lead_grade, c.priority]
          .map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leadsphere-saved-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand">Portfolio</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Saved leads</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg border border-border bg-surface">
            <button
              onClick={() => setShowArchived(false)}
              className={`px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-widest ${
                !showArchived ? "bg-brand text-brand-foreground" : "text-muted-foreground"
              } rounded-l-lg`}
            >
              Active
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-widest ${
                showArchived ? "bg-brand text-brand-foreground" : "text-muted-foreground"
              } rounded-r-lg`}
            >
              Archived
            </button>
          </div>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent"
          >
            <Download className="size-4" /> Export CSV
          </button>
        </div>
      </header>

      <div className="mb-6 flex items-center rounded-xl border border-border bg-surface p-2">
        <Search className="mx-2 size-4 text-muted-foreground" />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name, domain, or industry"
          className="flex-1 bg-transparent px-2 py-1.5 text-sm focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-16 text-center">
          <Bookmark className="mx-auto size-8 text-muted-foreground" />
          <h3 className="mt-4 font-semibold text-foreground">
            {showArchived ? "No archived leads" : "No saved leads yet"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Enrich a company and hit Save to keep it in your portfolio.
          </p>
          <Link
            to="/search"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-bold text-brand-foreground"
          >
            Enrich a company
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {filtered.map((l: any) => {
            const c = l.companies;
            return (
              <li key={l.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
                <ScoreGauge score={c?.lead_score ?? 0} grade={c?.lead_grade} size={64} />
                <Link
                  to="/company/$id"
                  params={{ id: c?.id ?? "" }}
                  className="min-w-0 flex-1 group"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-foreground group-hover:text-brand">
                      {c?.name}
                    </h3>
                    <PriorityBadge priority={c?.priority} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {c?.domain ?? "—"} · {c?.industry ?? "Unknown"} · {c?.hq ?? "—"}
                  </p>
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleArchive.mutate({ id: l.id, archived: l.archived })}
                    className="rounded-lg border border-border bg-background/60 p-2 text-muted-foreground hover:text-foreground"
                    aria-label={l.archived ? "Restore" : "Archive"}
                  >
                    {l.archived ? (
                      <ArchiveRestore className="size-4" />
                    ) : (
                      <Archive className="size-4" />
                    )}
                  </button>
                  <button
                    onClick={() => remove.mutate(l.id)}
                    className="rounded-lg border border-border bg-background/60 p-2 text-muted-foreground hover:text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
