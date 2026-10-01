"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";

interface Question {
  id: string;
  question_key: string;
  question: string;
  field_type: string;
  options?: string[] | null;
}

interface ClarificationFormProps {
  questions: Question[];
  runId: string;
  projectId: string;
  isAwaiting: boolean;
}

export function ClarificationForm({ questions, runId, projectId, isAwaiting }: ClarificationFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/agent/resume`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            run_id: runId,
            project_id: projectId,
            answers,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to submit answers");
      }

      router.push(`/projects/${projectId}/activity`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {questions.map((q, i) => (
        <div key={q.id} className="space-y-2">
          <Label htmlFor={`q-${q.id}`} className="text-sm font-medium">
            <span className="text-muted-foreground mr-2">{i + 1}.</span>
            {q.question}
          </Label>

          {q.field_type === "checkbox" && q.options ? (
            <div className="space-y-2 pl-4">
              {q.options.map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    checked={answers[q.question_key]?.includes(opt) || false}
                    onChange={(e) => {
                      const current = answers[q.question_key]
                        ? answers[q.question_key].split(", ")
                        : [];
                      const updated = e.target.checked
                        ? [...current, opt]
                        : current.filter((v) => v !== opt);
                      setAnswers((prev) => ({
                        ...prev,
                        [q.question_key]: updated.join(", "),
                      }));
                    }}
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          ) : (
            <Textarea
              id={`q-${q.id}`}
              placeholder="Your answer..."
              rows={3}
              className="resize-none"
              value={answers[q.question_key] || ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [q.question_key]: e.target.value }))
              }
              disabled={!isAwaiting}
            />
          )}
        </div>
      ))}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {isAwaiting && (
        <Button type="submit" disabled={loading} className="gap-1.5">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Submit answers & resume agent
            </>
          )}
        </Button>
      )}
    </form>
  );
}
