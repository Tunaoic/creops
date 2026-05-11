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
    <section className="bg-surface rounded-2xl border border-border p-5">
      <h3 className="text-headline text-text mb-3 capitalize">
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
          className="w-full px-3.5 py-2.5 text-[14px] leading-relaxed resize-y"
        />
      )}

      {isFile && (
        <div>
          <p className="text-[13px] text-text-muted mb-3">
            Upload to Drive / Dropbox / Frame.io and paste the shareable link.
          </p>
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-text-subtle shrink-0" strokeWidth={1.75} />
            <input
              type="url"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="flex-1 px-3.5 py-2.5 text-[14px]"
            />
          </div>
        </div>
      )}

      {outputType === "datetime" && (
        <input
          type="datetime-local"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full px-3.5 py-2.5 text-[14px]"
        />
      )}

      {outputType === "chips" && (
        <div>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="tag1, tag2, tag3..."
            className="w-full px-3.5 py-2.5 text-[14px]"
          />
          <p className="text-[12px] text-text-subtle mt-2">
            Comma-separated, max 15 tags
          </p>
        </div>
      )}

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
