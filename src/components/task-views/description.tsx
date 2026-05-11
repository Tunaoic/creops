"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { submitTask } from "@/db/actions";

export function TaskDescriptionView({
  taskId,
  initialValue,
}: {
  taskId: string;
  initialValue?: string;
}) {
  const router = useRouter();
  const [text, setText] = useState(initialValue ?? "");
  const [submitting, startSubmit] = useTransition();

  function submit() {
    startSubmit(async () => {
      await submitTask(taskId, text);
      router.refresh();
      router.back();
    });
  }

  return (
    <section className="bg-surface rounded border border-border p-4">
      <h3 className="text-[11px] font-mono uppercase tracking-[0.15em] text-text-subtle mb-3">
        Description
      </h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={18}
        placeholder="Hook 2 câu → 3 bullet points → CTA → timestamps → resources..."
        className="w-full px-3 py-2 rounded border border-border bg-bg text-[13px] font-mono leading-relaxed focus:outline-none focus:border-accent resize-y"
      />
      <div className="text-[12px] font-mono text-text-subtle mt-2">
        {text.length} chars · {text.split(/\s+/).filter(Boolean).length} words
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim() || submitting}
          className="btn-primary px-3 py-2 text-[13px] rounded inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Submit for Review →
        </button>
      </div>
    </section>
  );
}
