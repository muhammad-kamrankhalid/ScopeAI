import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClarificationForm } from "@/components/agent/clarification-form";

interface QuestionsPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function QuestionsPage({ params }: QuestionsPageProps) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get the latest agent run
  const { data: latestRun } = await supabase
    .from("agent_runs")
    .select("id, status")
    .eq("project_id", projectId)
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  // Get unanswered questions from the latest run
  const { data: questions } = latestRun
    ? await supabase
        .from("clarification_questions")
        .select("*")
        .eq("run_id", latestRun.id)
        .order("created_at")
    : { data: [] };

  const isAwaiting = latestRun?.status === "awaiting_input";

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Clarification Questions</h1>
        <p className="text-sm text-muted-foreground">
          The AI agent needs more information to generate an accurate project scope.
        </p>
      </div>

      {!questions || questions.length === 0 ? (
        <Card className="border-dashed border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-2 text-center">
            <p className="text-sm font-medium">No questions yet</p>
            <p className="text-xs text-muted-foreground">
              {latestRun
                ? "The agent didn't need clarification, or hasn't run yet."
                : "Run the AI agent from the Overview page first."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {isAwaiting && (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
              <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 bg-yellow-500/5 text-xs">
                Awaiting your input
              </Badge>
              <span className="text-xs text-muted-foreground">
                Answer these questions to continue scope generation.
              </span>
            </div>
          )}

          <ClarificationForm
            questions={questions}
            runId={latestRun!.id}
            projectId={projectId}
            isAwaiting={isAwaiting}
          />
        </div>
      )}
    </div>
  );
}
