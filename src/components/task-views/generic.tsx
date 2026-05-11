"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { submitTask } from "@/db/actions";
import { useTaskDraft } from "@/lib/use-task-draft";
import { isValidUrl } from "@/lib/url";

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
  const initial = typeof initialValue === "string" ? initialValue : "";
  const [text, setText, clearDraft] = useTaskDraft(taskId, initial);
  const [submitting, startSubmit] = useTransition();

  const isText =
    outputType === "text" ||
    outputType === "long_text" ||
    outputType === "markdown";
  const isFile = outputType === "file";

  // Inline validation — show before submit so user fixes without round-trip.
  const trimmed = text.trim();
  const urlError =
    isFile && trimmed.length > 0 && !isValidUrl(trimmed)
      ? "Must be a full URL starting with http:// or https://"
      : null;

  function submit() {
    if (urlError) {
      toast.error(urlError);
      return;
    }
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
          {urlError && (
            <p className="text-[12px] text-danger mt-2">{urlError}</p>
          )}
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
          disabled={!text.trim() || submitting || urlError !== null}
          className="btn-primary text-[14px] inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Submit for review →
        </button>
      </div>
    </section>
  );
}
