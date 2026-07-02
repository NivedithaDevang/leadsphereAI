import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — LeadSphereAI" }] }),
  component: Settings,
});

function Settings() {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", userRes.user.id)
        .maybeSingle();
      return { ...data, email: userRes.user.email, id: userRes.user.id };
    },
  });

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile?.full_name]);

  const save = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("No profile");
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: profile.id, full_name: fullName });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile saved");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Save failed"),
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand">Account</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Settings</h1>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-6 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Profile
        </h2>

        {isLoading ? (
          <Loader2 className="size-5 animate-spin text-brand" />
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Email
              </span>
              <input
                value={profile?.email ?? ""}
                disabled
                className="w-full rounded-lg border border-border bg-background/40 px-4 py-3 text-sm text-muted-foreground"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Full name
              </span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm focus:border-brand/60 focus:outline-none"
              />
            </label>

            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-brand-foreground disabled:opacity-60"
            >
              {save.isPending && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </button>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Workspace
        </h2>
        <p className="text-sm text-muted-foreground">
          Team workspaces, SSO, and audit logs ship in the Scale plan.
        </p>
      </section>
    </div>
  );
}
