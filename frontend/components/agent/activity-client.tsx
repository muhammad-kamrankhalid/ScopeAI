"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity } from "lucide-react";

interface AgentEvent {
  id: string;
  event_type: string;
  message: string;
  created_at: string;
}

interface ActivityClientProps {
  runId: string | null;
  initialEvents: AgentEvent[];
  isActive: boolean;
}

const eventIcons: Record<string, string> = {
  brief_analyzed: "🔍",
  requirements_extracted: "📋",
  missing_info_detected: "❓",
  awaiting_human_input: "⏸️",
  answers_received: "✅",
  info_complete: "✅",
  clarification_skipped: "⏭️",
  architecture_designed: "🏗️",
  risks_analyzed: "⚠️",
  roadmap_created: "🗺️",
  scope_complete: "🎉",
  error: "❌",
  stream_end: "🏁",
};

export function ActivityClient({ runId, initialEvents, isActive }: ActivityClientProps) {
  const [events, setEvents] = useState<AgentEvent[]>(initialEvents);
  const [streaming, setStreaming] = useState(isActive);

  useEffect(() => {
    if (!runId || !isActive) return;

    const es = new EventSource(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/agent/stream/${runId}`
    );

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.event_type === "stream_end") {
        setStreaming(false);
        es.close();
        return;
      }
      setEvents((prev) => {
        if (prev.find((ev) => ev.id === data.id)) return prev;
        return [...prev, data];
      });
    };

    es.onerror = () => {
      setStreaming(false);
      es.close();
    };

    return () => es.close();
  }, [runId, isActive]);

  if (!runId) {
    return (
      <Card className="border-dashed border-border/50">
        <CardContent className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          No agent runs yet. Start one from the Overview page.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {streaming && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Agent is running...</span>
        </div>
      )}

      {events.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Activity className="h-4 w-4" />
          Waiting for first event...
        </div>
      ) : (
        <div className="divide-y divide-border/50 border border-border/50 rounded-lg overflow-hidden">
          {events.map((event) => (
            <div key={event.id} className="flex items-start gap-3 p-3 hover:bg-muted/20 transition-colors">
              <span className="text-base shrink-0 mt-0.5">
                {eventIcons[event.event_type] || "•"}
              </span>
              <div className="space-y-0.5 min-w-0 flex-1">
                <p className="text-sm">{event.message}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs text-muted-foreground border-border/50 font-mono">
                    {event.event_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
