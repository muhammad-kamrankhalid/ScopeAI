"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";

interface NewProjectDialogProps {
  userId: string;
}

export function NewProjectDialog({ userId }: NewProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !brief.trim()) return;
    setLoading(true);
    setError(null);

    const { data: project, error: createError } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        name: name.trim(),
        client_name: clientName.trim() || null,
        brief: brief.trim(),
        status: "draft",
      })
      .select()
      .single();

    if (createError) {
      setError(createError.message);
      setLoading(false);
      return;
    }

    setOpen(false);
    router.push(`/projects/${project.id}/overview`);
    router.refresh();
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setName("");
      setClientName("");
      setBrief("");
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger>
        <Button size="sm" className="gap-1.5" type="button">
          <Plus className="h-3.5 w-3.5" />
          New project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create new project</DialogTitle>
          <DialogDescription>
            Paste the client brief below. The AI agent will analyze it and guide you through the discovery process.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="project-name">Project name <span className="text-destructive">*</span></Label>
            <Input
              id="project-name"
              placeholder="AI Customer Support Platform"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-name">Client / Company</Label>
            <Input
              id="client-name"
              placeholder="ABC Commerce (optional)"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brief">Client brief <span className="text-destructive">*</span></Label>
            <Textarea
              id="brief"
              placeholder="Paste whatever the client told you — emails, messages, call notes, requirements docs..."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={6}
              required
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim() || !brief.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
