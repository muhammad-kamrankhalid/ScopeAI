import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RisksPageProps {
  params: Promise<{ projectId: string }>;
}

const severityConfig: Record<string, { color: string; label: string }> = {
  high: { color: "border-red-500/30 text-red-400 bg-red-500/5", label: "High" },
  medium: { color: "border-yellow-500/30 text-yellow-400 bg-yellow-500/5", label: "Medium" },
  low: { color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5", label: "Low" },
};

export default async function RisksPage({ params }: RisksPageProps) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: risks } = await supabase
    .from("risks")
    .select("*")
    .eq("project_id", projectId)
    .order("severity");

  const high = risks?.filter((r) => r.severity === "high") || [];
  const medium = risks?.filter((r) => r.severity === "medium") || [];
  const low = risks?.filter((r) => r.severity === "low") || [];

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Risk Register</h1>
        <p className="text-sm text-muted-foreground">
          AI-identified risks with severity levels and mitigation strategies.
        </p>
      </div>

      {!risks || risks.length === 0 ? (
        <Card className="border-dashed border-border/50">
          <CardContent className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            No risks yet. Run the AI agent from the Overview page.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary bar */}
          <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg border border-border/50">
            {[{ label: "High", count: high.length, color: "text-red-400" },
              { label: "Medium", count: medium.length, color: "text-yellow-400" },
              { label: "Low", count: low.length, color: "text-emerald-400" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className={`text-lg font-bold ${s.color}`}>{s.count}</span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Risks by severity */}
          {[...high, ...medium, ...low].map((risk) => {
            const config = severityConfig[risk.severity];
            return (
              <div key={risk.id} className="space-y-2 p-4 border border-border/50 rounded-lg hover:border-border transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-medium">{risk.title}</h3>
                  <Badge variant="outline" className={`text-xs shrink-0 ${config.color}`}>
                    {config.label}
                  </Badge>
                </div>
                {risk.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{risk.description}</p>
                )}
                {risk.mitigation && (
                  <div className="pt-1">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Mitigation</p>
                    <p className="text-xs text-foreground/70 leading-relaxed">{risk.mitigation}</p>
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
