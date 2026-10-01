import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RoadmapPageProps {
  params: Promise<{ projectId: string }>;
}

const priorityColors: Record<string, string> = {
  high: "border-red-500/30 text-red-400 bg-red-500/5",
  medium: "border-yellow-500/30 text-yellow-400 bg-yellow-500/5",
  low: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5",
};

export default async function RoadmapPage({ params }: RoadmapPageProps) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: milestones } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("phase");

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Implementation Roadmap</h1>
        <p className="text-sm text-muted-foreground">
          Phased implementation plan with tasks, priorities, and estimates.
        </p>
      </div>

      {!milestones || milestones.length === 0 ? (
        <Card className="border-dashed border-border/50">
          <CardContent className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            No roadmap yet. Run the AI agent from the Overview page.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {milestones.map((milestone) => {
            const tasks: Array<{title: string; priority: string; complexity: string; estimated_days: number; dependencies: string[]}> = milestone.tasks_json || [];
            const totalDays = tasks.reduce((sum: number, t) => sum + (t.estimated_days || 0), 0);
            return (
              <div key={milestone.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{milestone.phase}</span>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">{milestone.title}</h2>
                    {milestone.description && (
                      <p className="text-xs text-muted-foreground">{milestone.description}</p>
                    )}
                  </div>
                  {totalDays > 0 && (
                    <Badge variant="outline" className="ml-auto text-xs text-muted-foreground">
                      ~{totalDays}d
                    </Badge>
                  )}
                </div>

                {tasks.length > 0 && (
                  <div className="ml-10 divide-y divide-border/50 border border-border/50 rounded-lg overflow-hidden">
                    {tasks.map((task, i) => (
                      <div key={i} className="flex items-center justify-between p-3 hover:bg-muted/20 transition-colors gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{task.title}</p>
                          {task.dependencies?.length > 0 && (
                            <p className="text-xs text-muted-foreground truncate">
                              Needs: {task.dependencies.join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={`text-xs ${priorityColors[task.priority] || ""}`}>
                            {task.priority}
                          </Badge>
                          {task.estimated_days && (
                            <span className="text-xs text-muted-foreground">{task.estimated_days}d</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
