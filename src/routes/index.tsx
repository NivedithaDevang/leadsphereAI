import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";
import { ScoreGauge } from "@/components/ScoreGauge";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  BarChart3,
  Mail,
  Bookmark,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "LeadSphereAI — Turn cold domains into hot revenue",
      },
      {
        name: "description",
        content:
          "AI-powered B2B lead enrichment and predictive scoring. Enter a company name or domain and get an enriched profile, 0-100 lead score, and outreach draft in seconds.",
      },
      { property: "og:title", content: "LeadSphereAI — Turn cold domains into hot revenue" },
      {
        property: "og:description",
        content:
          "Predictive B2B lead intelligence: enrich, score, and outreach — from a single search box.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />

      {/* HERO */}
      <header className="mx-auto max-w-4xl px-6 pt-24 pb-16 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface/50 px-3 py-1 text-xs font-medium text-muted-foreground animate-fade-in">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-brand" />
          </span>
          Next-Gen Lead Scoring is Live
        </div>
        <h1
          className="text-5xl font-bold tracking-tight text-foreground md:text-7xl animate-fade-in"
          style={{ animationDelay: "80ms" }}
        >
          Turn cold domains into <span className="italic text-brand">hot revenue.</span>
        </h1>
        <p
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground animate-fade-in"
          style={{ animationDelay: "160ms" }}
        >
          LeadSphereAI enriches any B2B company from a name or URL, predicts conversion
          probability, and drafts outreach in seconds. Stop chasing prospects — start closing
          partners.
        </p>
        <div
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in"
          style={{ animationDelay: "240ms" }}
        >
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="group inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-4 text-base font-bold text-brand-foreground transition-transform hover:scale-[1.02]"
          >
            Enrich your first lead
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface/50 px-8 py-4 text-base font-medium text-foreground transition-colors hover:bg-surface"
          >
            See how it works
          </a>
        </div>
      </header>

      {/* PRODUCT PREVIEW */}
      <section className="px-6 pb-24">
        <ProductPreview />
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-6 pb-24">
        <SectionHeader
          eyebrow="Platform"
          title="Everything a modern revenue team needs"
          subtitle="From first signal to signed contract."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-surface/60 p-6 transition-colors hover:border-brand/40"
            >
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <f.icon className="size-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 pb-24">
        <SectionHeader
          eyebrow="Pricing"
          title="Simple, usage-based"
          subtitle="Start free. Scale when your pipeline does."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-8 ${
                p.featured
                  ? "border-brand bg-surface glow-brand"
                  : "border-border bg-surface/60"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-8 rounded-full bg-brand px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-brand-foreground">
                  Most Popular
                </span>
              )}
              <h3 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
                {p.name}
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.per}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              <ul className="mt-6 space-y-3">
                {p.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                    <span className="text-foreground/90">{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className={`mt-8 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                  p.featured
                    ? "bg-brand text-brand-foreground hover:opacity-90"
                    : "border border-border bg-surface text-foreground hover:bg-accent"
                }`}
              >
                Get started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <SectionHeader
          eyebrow="Signal"
          title="Trusted by revenue teams that ship"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.author}
              className="rounded-2xl border border-border bg-surface/60 p-6"
            >
              <blockquote className="text-sm leading-relaxed text-foreground/90">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-brand/40 to-brand/10 font-mono text-sm font-bold text-brand">
                  {t.author[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{t.author}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 pb-24">
        <SectionHeader eyebrow="FAQ" title="Questions, answered" />
        <div className="mt-12 divide-y divide-border rounded-2xl border border-border bg-surface/60">
          {FAQ.map((item) => (
            <details key={item.q} className="group p-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between text-base font-semibold text-foreground">
                {item.q}
                <span className="ml-4 text-brand transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-brand/30 bg-surface p-12 text-center glow-brand">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            Ready to see the signal?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Enrich your first company in under 10 seconds. No credit card, no scraping.
          </p>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-4 text-base font-bold text-brand-foreground transition-transform hover:scale-[1.02]"
          >
            Start free
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mx-auto max-w-7xl border-t border-border px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            © 2026 LeadSphereAI · Predictive Revenue Intelligence
          </p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-brand">
              Privacy
            </a>
            <a href="#" className="hover:text-brand">
              Terms
            </a>
            <a href="#" className="hover:text-brand">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl shadow-brand/5">
      {/* Header row */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border bg-background/40 p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-background font-bold text-lg text-foreground">
            N
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Nexura Cloud Systems</h3>
            <p className="text-sm text-muted-foreground">
              nexura.io · San Francisco, CA
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Priority
            </p>
            <p className="mt-1 text-sm font-semibold text-brand">Critical</p>
          </div>
          <ScoreGauge score={92} grade="A+" size={96} />
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-px bg-border md:grid-cols-12">
        <div className="bg-surface p-8 md:col-span-8">
          <SectionLabel>AI Company Summary</SectionLabel>
          <p className="mt-4 leading-relaxed text-foreground/90">
            Nexura recently secured $42M Series B for their distributed database
            infrastructure. Headcount grew 35% in Q3, specifically DevOps and Sales.
            Expanding into EMEA with a focus on enterprise financial services.
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-background/60 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">Outreach Draft</h4>
              <button className="rounded bg-secondary px-2 py-1 font-mono text-[10px] font-bold uppercase text-muted-foreground hover:bg-accent">
                Copy
              </button>
            </div>
            <div className="space-y-2 font-mono text-sm text-muted-foreground">
              <p>
                <span className="text-brand/70">Subject:</span> Scaling Nexura's EMEA
                Infrastructure
              </p>
              <p>Hi Sarah,</p>
              <p>
                Impressive growth at Nexura this quarter. Given your focus on the EMEA
                expansion, LeadSphereAI can help identify high-intent accounts in London
                and Berlin markets...
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 bg-background/40 p-8 md:col-span-4">
          <div>
            <SectionLabel>Revenue Intent</SectionLabel>
            <div className="mt-6 flex h-32 items-end gap-1.5">
              {[20, 45, 30, 85, 60, 95, 40].map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t-sm animate-chart-grow ${
                    h > 70 ? "bg-brand" : "bg-secondary"
                  }`}
                  style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>
            <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-tighter text-muted-foreground">
              Last 7 days surge
            </p>
          </div>

          <div>
            <SectionLabel>Key Tech Stack</SectionLabel>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Kubernetes", "PostgreSQL", "Salesforce", "Stripe"].map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-border bg-secondary px-2.5 py-1 font-mono text-xs text-foreground/80"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
      <span className="size-1.5 rounded-full bg-brand" />
      {children}
    </div>
  );
}

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Company Enrichment",
    desc: "Enter a name or domain. Get industry, HQ, tech stack, funding signals, and news — all AI-inferred, no scraping.",
  },
  {
    icon: Target,
    title: "Predictive Lead Scoring",
    desc: "A 0–100 score with grade, conversion probability, and reasoning for every signal that moved the needle.",
  },
  {
    icon: Mail,
    title: "One-Click Outreach",
    desc: "Cold emails, follow-ups, and pitches drafted with company context — ready for your CRM.",
  },
  {
    icon: Zap,
    title: "Tech Stack Detection",
    desc: "Spot buying signals: hiring surges, tech migrations, expansion moves. Personalize with what actually matters.",
  },
  {
    icon: BarChart3,
    title: "Pipeline Analytics",
    desc: "Industry distribution, sentiment trends, and score histograms — see where your funnel is strongest.",
  },
  {
    icon: Bookmark,
    title: "Saved Leads & Tags",
    desc: "Bookmark, tag, annotate, and export. Your enrichment cache grows with every search.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    per: "/month",
    desc: "For solo founders and testing.",
    features: ["20 enrichments / month", "Lead scoring & summary", "3 saved leads"],
    featured: false,
  },
  {
    name: "Growth",
    price: "$49",
    per: "/user/mo",
    desc: "For sales teams shipping outbound.",
    features: [
      "1,000 enrichments / month",
      "Outreach drafts unlimited",
      "Unlimited saved leads",
      "CSV export",
      "Analytics dashboard",
    ],
    featured: true,
  },
  {
    name: "Scale",
    price: "Custom",
    per: "",
    desc: "For revenue orgs.",
    features: [
      "Unlimited enrichments",
      "Priority AI models",
      "Team workspaces",
      "SSO & audit logs",
      "Dedicated support",
    ],
    featured: false,
  },
];

const TESTIMONIALS = [
  {
    quote:
      "We cut our SDR research time by 70%. LeadSphere writes the first paragraph for us.",
    author: "Sarah Chen",
    role: "VP Sales, Vertex Labs",
  },
  {
    quote:
      "The score reasoning is what sold me. It's not a black box — we finally trust the ranking.",
    author: "Marcus Ivanov",
    role: "Head of GTM, Orbit",
  },
  {
    quote: "Best outbound tool since Apollo. And the UI actually respects our attention.",
    author: "Priya Rao",
    role: "Founder, Lumina Growth",
  },
];

const FAQ = [
  {
    q: "How does the enrichment actually work?",
    a: "LeadSphereAI uses large language models to infer public company information from a name or domain — industry, HQ, employees, tech stack, recent news signals, and more. No unauthorized scraping.",
  },
  {
    q: "Can I trust the lead score?",
    a: "Every score comes with a reasoning breakdown. You see which signals (funding, hiring, tech adoption, news sentiment) contributed and by how much.",
  },
  {
    q: "Do you integrate with my CRM?",
    a: "CSV export is available on Growth. Native Salesforce, HubSpot, and Attio integrations are on the Scale plan.",
  },
  {
    q: "Is my search history private?",
    a: "Yes. Your searches and saved leads are scoped to your account via row-level security. Nothing is shared.",
  },
];
