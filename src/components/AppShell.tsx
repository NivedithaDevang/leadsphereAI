import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Search,
  Bookmark,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Sphere } from "@/components/Sphere";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/search", label: "Search", icon: Search },
  { to: "/saved", label: "Saved Leads", icon: Bookmark },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

/**
 * Authenticated app shell: sidebar + main content.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", userRes.user.id)
        .maybeSingle();
      return { ...data, email: userRes.user.email };
    },
  });

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-lg lg:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Sphere />
          <span className="font-bold">LeadSphereAI</span>
        </Link>
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="rounded-md p-2 hover:bg-accent"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-surface transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="hidden h-16 items-center border-b border-border px-6 lg:flex">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <Sphere />
            <span className="text-base font-bold tracking-tight text-foreground">
              LeadSphere<span className="text-brand">AI</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6 pt-20 lg:pt-6">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{
                className: "bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand",
              }}
              activeOptions={{ exact: false }}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand/40 to-brand/10 font-mono text-sm font-bold text-brand">
              {(profile?.full_name ?? profile?.email ?? "U")[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {profile?.full_name ?? "Analyst"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main */}
      <main className="flex-1 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
