"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitTask } from "@/db/actions";
import { useTaskDraft } from "@/lib/use-task-draft";

export function TaskDescriptionView({
  taskId,
  initialValue,
}: {
  taskId: string;
  initialValue?: string;
}) {
  const router = useRouter();
  const [text, setText, clearDraft] = useTaskDraft(taskId, initialValue ?? "");
  const [submitting, startSubmit] = useTransition();

  function submit() {
    startSubmit(async () => {
      const result = await submitTask(taskId, text);
      if (result.ok) {
        clearDraft();
        toast.success("Submitted for review");
        router.refresh();
        router.back();
      } else {
        toast.error(result.reason);
      }
    });
  }

  return (
    <section className="bg-surface rounded-2xl border border-border p-5">
      <h3 className="text-headline text-text mb-3">Description</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={18}
        placeholder="Hook 2 lines → 3 bullet points → CTA → timestamps → resources..."
        className="w-full px-3.5 py-2.5 text-[14px] leading-relaxed resize-y"
      />
      <div className="text-[13px] text-text-subtle mt-2 tabular-nums">
        {text.length} chars · {text.split(/\s+/).filter(Boolean).length} words
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim() || submitting}
          className="btn-primary text-[14px] inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Submit for review →
        </button>
      </div>
    </section>
  );
}
