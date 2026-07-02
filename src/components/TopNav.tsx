import { Link } from "@tanstack/react-router";
import { Sphere } from "./Sphere";

/**
 * Public marketing navbar (top of landing page).
 */
export function TopNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <Sphere />
          <span className="text-lg font-bold tracking-tight text-foreground">
            LeadSphere<span className="text-brand">AI</span>
          </span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
          >
            Platform
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
          >
            FAQ
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-brand hover:text-brand-foreground"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
