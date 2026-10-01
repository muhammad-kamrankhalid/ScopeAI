import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, FolderOpen, Sparkles, LogOut, ArrowRight } from "lucide-react";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  analyzing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  awaiting_input: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  analyzing: "Analyzing",
  awaiting_input: "Needs Input",
  completed: "Completed",
  error: "Error",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", user.id)
    .single();

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">ScopeAI</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Separator orientation="vertical" className="h-4" />
            <form action="/auth/signout" method="post">
              <Button variant="ghost" size="sm" type="submit" className="gap-1.5 text-muted-foreground">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Hero */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Good {getGreeting()}, {firstName}
          </h1>
          <p className="text-muted-foreground text-sm">
            {projects?.length
              ? `You have ${projects.length} project${projects.length !== 1 ? "s" : ""} in your workspace.`
              : "Create your first project to get started."}
          </p>
        </div>

        {/* Stats */}
        {projects && projects.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total projects", value: projects.length },
              { label: "Completed", value: projects.filter((p) => p.status === "completed").length },
              { label: "In progress", value: projects.filter((p) => ["analyzing", "awaiting_input"].includes(p.status)).length },
              { label: "Drafts", value: projects.filter((p) => p.status === "draft").length },
            ].map((stat) => (
              <Card key={stat.label} className="border-border/50">
                <CardContent className="pt-4 pb-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Projects section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Projects
            </h2>
            <NewProjectDialog userId={user.id} />
          </div>

          {!projects || projects.length === 0 ? (
            <Card className="border-dashed border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-medium">No projects yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create a project and paste a client brief to get started.
                  </p>
                </div>
                <NewProjectDialog userId={user.id} />
              </CardContent>
            </Card>
          ) : (
            <div className="divide-y divide-border/50 border border-border/50 rounded-lg overflow-hidden">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors group">
                  <Link
                    href={`/projects/${project.id}/overview`}
                    className="flex-1 flex items-center justify-between min-w-0"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-medium text-sm truncate">{project.name}</p>
                      {project.client_name && (
                        <p className="text-xs text-muted-foreground">{project.client_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusColors[project.status] || ""}`}
                      >
                        {statusLabels[project.status] || project.status}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors mr-2" />
                    </div>
                  </Link>
                  <div className="shrink-0 ml-2">
                    <DeleteProjectButton projectId={project.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
