import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ArchitecturePageProps {
  params: Promise<{ projectId: string }>;
}

const typeColors: Record<string, string> = {
  frontend: "border-blue-500/30 text-blue-400 bg-blue-500/5",
  backend: "border-purple-500/30 text-purple-400 bg-purple-500/5",
  database: "border-orange-500/30 text-orange-400 bg-orange-500/5",
  external_api: "border-cyan-500/30 text-cyan-400 bg-cyan-500/5",
  ai: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5",
  infrastructure: "border-yellow-500/30 text-yellow-400 bg-yellow-500/5",
};

export default async function ArchitecturePage({ params }: ArchitecturePageProps) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: architecture } = await supabase
    .from("architectures")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const diagram = architecture?.diagram_json;

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Solution Architecture</h1>
        <p className="text-sm text-muted-foreground">AI-designed technical architecture for the project.</p>
      </div>

      {!architecture ? (
        <Card className="border-dashed border-border/50">
          <CardContent className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            No architecture yet. Run the AI agent from the Overview page.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary */}
          {diagram?.summary && (
            <Card className="border-border/50">
              <CardContent className="pt-4">
                <p className="text-sm leading-relaxed">{diagram.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Components */}
          {diagram?.components?.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Components ({diagram.components.length})
              </h2>
              <div className="divide-y divide-border/50 border border-border/50 rounded-lg overflow-hidden">
                {diagram.components.map((c: { name: string; type: string; technology: string; description: string }, i: number) => (
                  <div key={i} className="p-4 space-y-1.5 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{c.name}</p>
                      <Badge variant="outline" className={`text-xs ${typeColors[c.type] || ""}`}>{c.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                    <p className="text-xs text-primary/70 font-mono">{c.technology}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Integrations */}
          {diagram?.integrations?.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Integrations ({diagram.integrations.length})
              </h2>
              <div className="divide-y divide-border/50 border border-border/50 rounded-lg overflow-hidden">
                {diagram.integrations.map((intg: { name: string; complexity: string; purpose: string }, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{intg.name}</p>
                      <p className="text-xs text-muted-foreground">{intg.purpose}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs ${
                      intg.complexity === "high" ? "border-red-500/30 text-red-400 bg-red-500/5" :
                      intg.complexity === "medium" ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/5" :
                      "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                    }`}>
                      {intg.complexity} complexity
                    </Badge>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Data flow */}
          {diagram?.data_flow && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Data Flow</h2>
              <Card className="border-border/50">
                <CardContent className="pt-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">{diagram.data_flow}</p>
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
