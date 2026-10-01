import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RunAgentButton } from "@/components/agent/run-agent-button";
import { FileText, ListChecks, ShieldAlert, Map } from "lucide-react";

interface OverviewPageProps {
  params: Promise<{ projectId: string }>;
}

function calculateProgress(stats: {
  requirements: number;
  architecture: boolean;
  risks: number;
  milestones: number;
}): number {
  let score = 0;
  if (stats.requirements > 0) score += 30;
  if (stats.architecture) score += 25;
  if (stats.risks > 0) score += 20;
  if (stats.milestones > 0) score += 25;
  return score;
}

export default async function OverviewPage({ params }: OverviewPageProps) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [projectRes, requirementsRes, architecturesRes, risksRes, milestonesRes, runRes] =
    await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("requirements").select("id", { count: "exact" }).eq("project_id", projectId),
      supabase.from("architectures").select("id").eq("project_id", projectId).limit(1),
      supabase.from("risks").select("id", { count: "exact" }).eq("project_id", projectId),
      supabase.from("milestones").select("id, phase", { count: "exact" }).eq("project_id", projectId),
      supabase.from("agent_runs").select("id, status").eq("project_id", projectId).order("started_at", { ascending: false }).limit(1),
    ]);

  const project = projectRes.data;
  const stats = {
    requirements: requirementsRes.count ?? 0,
    architecture: (architecturesRes.data?.length ?? 0) > 0,
    risks: risksRes.count ?? 0,
    milestones: milestonesRes.count ?? 0,
  };
  const progress = calculateProgress(stats);
  const latestRun = runRes.data?.[0];

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{project?.name}</h1>
          {project?.client_name && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {project.client_name}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Created {new Date(project?.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}
        </p>
      </div>

      {/* Run Agent + Progress */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Scope Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold">{progress}%</span>
            <RunAgentButton
              projectId={projectId}
              userId={user.id}
              brief={project?.brief || ""}
              latestRunId={latestRun?.id}
              runStatus={latestRun?.status}
            />
          </div>
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            {progress === 100
              ? "Scope generation complete. Review and approve AI outputs below."
              : "Run the AI agent to generate requirements, architecture, risks, and roadmap."}
          </p>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: ListChecks, label: "Requirements", value: stats.requirements, href: "requirements" },
          { icon: FileText, label: "Architecture", value: stats.architecture ? "Ready" : "—", href: "architecture" },
          { icon: ShieldAlert, label: "Risks", value: stats.risks, href: "risks" },
          { icon: Map, label: "Milestones", value: stats.milestones, href: "roadmap" },
        ].map((stat) => (
          <a key={stat.label} href={`/projects/${projectId}/${stat.href}`}>
            <Card className="border-border/50 hover:border-border transition-colors cursor-pointer">
              <CardContent className="pt-4 pb-4 space-y-2">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      {/* Brief preview */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Client Brief</h2>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap line-clamp-6">
              {project?.brief}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
