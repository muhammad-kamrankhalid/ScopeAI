"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface RequirementActionsProps {
  requirementId: string;
  currentStatus: string;
}

export function RequirementActions({ requirementId, currentStatus }: RequirementActionsProps) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleAction = async (action: "approve" | "reject") => {
    setLoading(action);
    const newStatus = action === "approve" ? "approved" : "rejected";
    await supabase.from("requirements").update({ status: newStatus }).eq("id", requirementId);
    router.refresh();
    setLoading(null);
  };

  if (currentStatus !== "pending") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground h-7"
        onClick={() => handleAction("approve")}
      >
        Reset
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
        onClick={() => handleAction("approve")}
        disabled={loading !== null}
        title="Approve"
      >
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-red-500 hover:text-red-400 hover:bg-red-500/10"
        onClick={() => handleAction("reject")}
        disabled={loading !== null}
        title="Reject"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
