"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { submitTask } from "@/db/actions";

export function TaskTitleView({
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
    <div className="space-y-4">
      <section className="bg-surface rounded border border-border p-4">
        <h3 className="text-[11px] font-mono uppercase tracking-[0.15em] text-text-subtle mb-3">
          Title
        </h3>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="vd: Tôi thử 5 cách growth, cách #3 mới shock"
          className="w-full px-3 py-2 rounded text-[14px] border border-border bg-bg focus:outline-none focus:border-accent"
        />
        <div className="text-[12px] font-mono text-text-subtle mt-2">
          {text.length} chars · sweet spot 40-70
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
    </div>
  );
}
