"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Play, RefreshCw } from "lucide-react";

interface RunAgentButtonProps {
  projectId: string;
  userId: string;
  brief: string;
  latestRunId?: string;
  runStatus?: string;
}

export function RunAgentButton({
  projectId,
  userId,
  brief,
  latestRunId,
  runStatus,
}: RunAgentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isRunning = runStatus === "running" || runStatus === "awaiting_input";

  const handleRun = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/agent/start`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: projectId, user_id: userId, brief }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to start agent");
      }

      router.push(`/projects/${projectId}/activity`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  if (isRunning) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/projects/${projectId}/activity`)}
        className="gap-1.5"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Agent running
      </Button>
    );
  }

  return (
    <div className="space-y-1">
      <Button
        size="sm"
        onClick={handleRun}
        disabled={loading}
        className="gap-1.5"
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Starting...
          </>
        ) : latestRunId ? (
          <>
            <RefreshCw className="h-3.5 w-3.5" />
            Re-run agent
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5" />
            Run AI agent
          </>
        )}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
