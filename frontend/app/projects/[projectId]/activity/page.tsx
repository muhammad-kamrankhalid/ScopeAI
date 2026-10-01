import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ActivityClient } from "@/components/agent/activity-client";

interface ActivityPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ActivityPage({ params }: ActivityPageProps) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: latestRun } = await supabase
    .from("agent_runs")
    .select("id, status")
    .eq("project_id", projectId)
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  const { data: events } = latestRun
    ? await supabase
        .from("agent_events")
        .select("*")
        .eq("run_id", latestRun.id)
        .order("created_at")
    : { data: [] };

  const isActive = latestRun?.status === "running" || latestRun?.status === "awaiting_input";

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">AI Activity</h1>
        <p className="text-sm text-muted-foreground">
          Real-time log of everything the agent did — transparency, not magic.
        </p>
      </div>

      <ActivityClient
        runId={latestRun?.id || null}
        initialEvents={events || []}
        isActive={isActive}
      />
    </div>
  );
}
