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
      <section className="bg-surface rounded border border-border p-4">
        <h3 className="text-[11px] font-mono uppercase tracking-[0.15em] text-text-subtle mb-3">
          Material Reference
        </h3>
        <div className="space-y-2 text-[13px]">
          {channels.length > 0 && (
            <div>
              <span className="text-text-subtle">Channels: </span>
              {channels.join(", ")}
            </div>
          )}
          {brief && (
            <div>
              <span className="text-text-subtle">Brief: </span>
              <span>{brief}</span>
            </div>
          )}
          {sourceLinks && sourceLinks.length > 0 && (
            <div className="pt-2 border-t border-border">
              <div className="text-text-subtle mb-1.5">Source materials:</div>
              <div className="space-y-1">
                {sourceLinks.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-info hover:underline truncate"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {s.label || s.url}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Submit */}
      <section className="bg-surface rounded border border-border p-4">
        <h3 className="text-[11px] font-mono uppercase tracking-[0.15em] text-text-subtle mb-3">
          Final Video Link
        </h3>
        <p className="text-[12px] text-text-subtle mb-2">
          Upload final cut lên Drive/Frame.io rồi paste link bên dưới.
        </p>
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-text-subtle shrink-0" />
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://drive.google.com/... hoặc https://frame.io/..."
            className="flex-1 px-3 py-2 rounded text-[13px] border border-border bg-bg focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={submit}
            disabled={!link.trim() || submitting}
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
