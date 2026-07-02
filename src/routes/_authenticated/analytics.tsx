import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — LeadSphereAI" }] }),
  component: Analytics,
});

const CHART_COLORS = ["#ccff00", "#22d3ee", "#a78bfa", "#fb923c", "#f472b6", "#4ade80"];

function Analytics() {
  const { data } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return null;
      const { data: rows } = await supabase
        .from("companies")
        .select("industry, tech_stack, lead_score, priority, news_sentiment")
        .eq("created_by", userRes.user.id);
      return rows ?? [];
    },
  });

  const industryDist = countBy(data ?? [], (r) => r.industry ?? "Unknown");
  const priorityDist = countBy(data ?? [], (r) => r.priority ?? "Medium");
  const sentimentDist = countBy(data ?? [], (r) => r.news_sentiment ?? "neutral");
  const techDist = countBy(
    (data ?? []).flatMap((r) => r.tech_stack ?? []) as string[],
    (t) => t,
  );

  const scoreBuckets = [
    { name: "0-59", value: 0 },
    { name: "60-69", value: 0 },
    { name: "70-79", value: 0 },
    { name: "80-89", value: 0 },
    { name: "90-100", value: 0 },
  ];
  for (const row of data ?? []) {
    const s = row.lead_score ?? 0;
    if (s < 60) scoreBuckets[0].value++;
    else if (s < 70) scoreBuckets[1].value++;
    else if (s < 80) scoreBuckets[2].value++;
    else if (s < 90) scoreBuckets[3].value++;
    else scoreBuckets[4].value++;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand">Signal Map</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-2 text-muted-foreground">
          Portfolio-wide view of your enriched leads.
        </p>
      </header>

      {(!data || data.length === 0) ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-16 text-center">
          <p className="text-sm text-muted-foreground">
            Enrich a few companies to unlock analytics.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-6">
          <ChartCard title="Score Distribution" className="lg:col-span-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={scoreBuckets}>
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#1e293b" }} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#1e293b" }} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(204,255,0,0.06)" }} />
                <Bar dataKey="value" fill="#ccff00" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Priority Mix" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={priorityDist}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {priorityDist.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <Legend items={priorityDist} />
          </ChartCard>

          <ChartCard title="Top Industries" className="lg:col-span-3">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart layout="vertical" data={industryDist.slice(0, 8)}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} width={110} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(204,255,0,0.06)" }} />
                <Bar dataKey="value" fill="#ccff00" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Tech Stack Distribution" className="lg:col-span-3">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart layout="vertical" data={techDist.slice(0, 8)}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} width={110} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(34,211,238,0.06)" }} />
                <Bar dataKey="value" fill="#22d3ee" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="News Sentiment" className="lg:col-span-6">
            <div className="grid grid-cols-3 gap-4">
              {sentimentDist.map((s, i) => (
                <div
                  key={s.name}
                  className="rounded-xl border border-border bg-background/60 p-6 text-center"
                >
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {s.name}
                  </p>
                  <p
                    className="mt-2 font-mono text-4xl font-bold"
                    style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}
                  >
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-6 ${className}`}>
      <div className="mb-4 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
        <span className="size-1.5 rounded-full bg-brand" />
        {title}
      </div>
      {children}
    </div>
  );
}

function Legend({ items }: { items: Array<{ name: string; value: number }> }) {
  return (
    <ul className="mt-4 space-y-1.5 text-xs">
      {items.map((it, i) => (
        <li key={it.name} className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <span
              className="size-2 rounded-full"
              style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            {it.name}
          </span>
          <span className="font-mono text-foreground">{it.value}</span>
        </li>
      ))}
    </ul>
  );
}

const tooltipStyle = {
  background: "hsl(217 33% 12%)",
  border: "1px solid hsl(217 33% 25%)",
  borderRadius: 8,
  fontSize: 12,
} as const;

function countBy<T>(arr: T[], keyFn: (t: T) => string) {
  const map = new Map<string, number>();
  for (const item of arr) {
    const k = keyFn(item);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}
