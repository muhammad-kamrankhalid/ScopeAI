import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RequirementActions } from "@/components/requirements/requirement-actions";

interface RequirementsPageProps {
  params: Promise<{ projectId: string }>;
}

const priorityColors: Record<string, string> = {
  high: "border-red-500/30 text-red-400 bg-red-500/5",
  medium: "border-yellow-500/30 text-yellow-400 bg-yellow-500/5",
  low: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5",
};

const statusColors: Record<string, string> = {
  pending: "border-border text-muted-foreground",
  approved: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5",
  rejected: "border-red-500/30 text-red-400 bg-red-500/5 line-through",
};

export default async function RequirementsPage({ params }: RequirementsPageProps) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: requirements } = await supabase
    .from("requirements")
    .select("*")
    .eq("project_id", projectId)
    .order("type")
    .order("priority");

  const functional = requirements?.filter((r) => r.type === "functional") || [];
  const nonFunctional = requirements?.filter((r) => r.type === "non_functional") || [];

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Requirements</h1>
        <p className="text-sm text-muted-foreground">
          AI-generated requirements. Approve, edit, or reject each one.
        </p>
      </div>

      {!requirements || requirements.length === 0 ? (
        <Card className="border-dashed border-border/50">
          <CardContent className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            No requirements yet. Run the AI agent from the Overview page.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Functional */}
          {functional.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Functional ({functional.length})
              </h2>
              <div className="divide-y divide-border/50 border border-border/50 rounded-lg overflow-hidden">
                {functional.map((req) => (
                  <div key={req.id} className="flex items-start justify-between p-4 gap-4 hover:bg-muted/20 transition-colors">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className={`text-sm font-medium ${req.status === "rejected" ? "line-through text-muted-foreground" : ""}`}>
                        {req.title}
                      </p>
                      {req.description && (
                        <p className="text-xs text-muted-foreground">{req.description}</p>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant="outline" className={`text-xs ${priorityColors[req.priority]}`}>
                          {req.priority}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${statusColors[req.status]}`}>
                          {req.status}
                        </Badge>
                      </div>
                    </div>
                    <RequirementActions requirementId={req.id} currentStatus={req.status} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Non-functional */}
          {nonFunctional.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Non-Functional ({nonFunctional.length})
              </h2>
              <div className="divide-y divide-border/50 border border-border/50 rounded-lg overflow-hidden">
                {nonFunctional.map((req) => (
                  <div key={req.id} className="flex items-start justify-between p-4 gap-4 hover:bg-muted/20 transition-colors">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className={`text-sm font-medium ${req.status === "rejected" ? "line-through text-muted-foreground" : ""}`}>
                        {req.title}
                      </p>
                      {req.description && (
                        <p className="text-xs text-muted-foreground">{req.description}</p>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant="outline" className={`text-xs ${priorityColors[req.priority]}`}>
                          {req.priority}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${statusColors[req.status]}`}>
                          {req.status}
                        </Badge>
                      </div>
                    </div>
                    <RequirementActions requirementId={req.id} currentStatus={req.status} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
