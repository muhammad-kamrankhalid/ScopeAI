"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard, ListChecks, MessageSquare, Network,
  ShieldAlert, Map, Activity, ChevronLeft, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  status: string;
}

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "overview" },
  { label: "Requirements", icon: ListChecks, path: "requirements" },
  { label: "Questions", icon: MessageSquare, path: "questions" },
  { label: "Architecture", icon: Network, path: "architecture" },
  { label: "Risks", icon: ShieldAlert, path: "risks" },
  { label: "Roadmap", icon: Map, path: "roadmap" },
  { label: "AI Activity", icon: Activity, path: "activity" },
];

const statusColors: Record<string, string> = {
  draft: "border-border text-muted-foreground",
  analyzing: "border-blue-500/30 text-blue-400 bg-blue-500/5",
  awaiting_input: "border-yellow-500/30 text-yellow-400 bg-yellow-500/5",
  completed: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5",
  error: "border-red-500/30 text-red-400 bg-red-500/5",
};

export function ProjectSidebar({ project }: { project: Project }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-border/50 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="p-4 border-b border-border/50">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-3">
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="text-xs">Dashboard</span>
        </Link>
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span className="font-semibold text-sm tracking-tight truncate">ScopeAI</span>
        </div>
      </div>

      {/* Project info */}
      <div className="px-4 py-3 border-b border-border/50 space-y-1">
        <p className="text-xs font-medium truncate" title={project.name}>{project.name}</p>
        {project.client_name && (
          <p className="text-xs text-muted-foreground truncate">{project.client_name}</p>
        )}
        <Badge variant="outline" className={cn("text-xs mt-1", statusColors[project.status])}>
          {project.status === "awaiting_input" ? "Needs Input" : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </Badge>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map((item) => {
          const href = `/projects/${project.id}/${item.path}`;
          const isActive = pathname === href;
          return (
            <Link
              key={item.path}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator />
      <div className="p-3 text-xs text-muted-foreground text-center">
        ScopeAI v1.0
      </div>
    </aside>
  );
}
