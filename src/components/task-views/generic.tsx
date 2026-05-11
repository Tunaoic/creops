"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ExternalLink } from "lucide-react";
import { submitTask } from "@/db/actions";

export function TaskGenericView({
  taskId,
  templateItemKey,
  outputType,
  initialValue,
}: {
  taskId: string;
  templateItemKey: string;
  outputType: string;
  initialValue: unknown;
}) {
  const router = useRouter();
  const [text, setText] = useState(
    typeof initialValue === "string" ? initialValue : ""
  );
  const [submitting, startSubmit] = useTransition();

  const isText =
    outputType === "text" ||
    outputType === "long_text" ||
    outputType === "markdown";
  const isFile = outputType === "file";

  function submit() {
    startSubmit(async () => {
      await submitTask(taskId, text);
      router.refresh();
      router.back();
    });
  }

  // Long text / markdown / text → textarea
  // File → URL input (link to upload)
  // Datetime → datetime input
  // Chips → comma-separated input

  return (
    <section className="bg-surface rounded border border-border p-4">
      <h3 className="text-[11px] font-mono uppercase tracking-[0.15em] text-text-subtle mb-3 capitalize">
        {templateItemKey.replace(/_/g, " ")}
      </h3>

      {isText && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={
            templateItemKey === "post_copy" || templateItemKey === "thread_copy"
              ? 14
              : 4
          }
          placeholder={`Enter ${templateItemKey.replace(/_/g, " ")}...`}
          className="w-full px-3 py-2 rounded border border-border bg-bg text-[13px] leading-relaxed focus:outline-none focus:border-accent resize-y"
        />
      )}

      {isFile && (
        <div>
          <p className="text-[12px] text-text-subtle mb-2">
            Upload file lên Drive / Dropbox / Frame.io rồi paste link.
          </p>
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-text-subtle shrink-0" />
            <input
              type="url"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="flex-1 px-3 py-2 rounded text-[13px] border border-border bg-bg focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      )}

      {outputType === "datetime" && (
        <input
          type="datetime-local"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full px-3 py-2 rounded border border-border bg-bg text-[13px] focus:outline-none focus:border-accent"
        />
      )}

      {outputType === "chips" && (
        <div>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="tag1, tag2, tag3..."
            className="w-full px-3 py-2 rounded border border-border bg-bg text-[13px] focus:outline-none focus:border-accent"
          />
          <p className="text-[11px] text-text-subtle mt-1">
            Comma-separated, max 15 tags
          </p>
        </div>
      )}

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
