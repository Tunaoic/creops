"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Video, Loader2, ExternalLink } from "lucide-react";
import { submitTask } from "@/db/actions";

export function TaskMasterVideoView({
  taskId,
  currentOutput,
  channels,
  brief,
  sourceLinks,
}: {
  taskId: string;
  deliverableId: string;
  currentOutput?: string;
  channels: string[];
  brief?: string;
  sourceAssetNames: string[];
  sourceLinks?: Array<{ url: string; label: string }>;
}) {
  const router = useRouter();
  const [link, setLink] = useState(currentOutput ?? "");
  const [submitting, startSubmit] = useTransition();

  function submit() {
    startSubmit(async () => {
      await submitTask(taskId, link);
      router.refresh();
      router.back();
    });
  }

  return (
    <div className="space-y-4">
      {/* Material reference */}
      <section className="bg-surface rounded-2xl border border-border p-5">
        <h3 className="text-headline text-text mb-3">Material reference</h3>
        <div className="space-y-2 text-[14px]">
          {channels.length > 0 && (
            <div>
              <span className="text-text-muted">Channels: </span>
              <span className="text-text">{channels.join(", ")}</span>
            </div>
          )}
          {brief && (
            <div>
              <span className="text-text-muted">Brief: </span>
              <span className="text-text">{brief}</span>
            </div>
          )}
          {sourceLinks && sourceLinks.length > 0 && (
            <div className="pt-3 border-t border-border">
              <div className="text-text-muted mb-2">Source materials</div>
              <div className="space-y-1.5">
                {sourceLinks.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-info hover:underline truncate"
                  >
                    <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
                    {s.label || s.url}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Submit */}
      <section className="bg-surface rounded-2xl border border-border p-5">
        <h3 className="text-headline text-text mb-2">Final video link</h3>
        <p className="text-[13px] text-text-muted mb-3">
          Upload your final cut to Drive / Frame.io and paste the shareable link.
        </p>
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-text-subtle shrink-0" strokeWidth={1.75} />
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://drive.google.com/... or https://frame.io/..."
            className="flex-1 px-3.5 py-2.5 text-[14px]"
          />
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={submit}
            disabled={!link.trim() || submitting}
            className="btn-primary text-[14px] inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Submit for review →
          </button>
        </div>
      </section>
    </div>
  );
}
