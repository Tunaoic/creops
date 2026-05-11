"use client";

import { useState, useTransition } from "react";
import { Plus, X, CheckCircle2 } from "lucide-react";
import {
  CHANNEL_LABEL,
  DELIVERABLE_TYPE_CHANNELS,
  DELIVERABLE_TYPE_LABEL,
  type ChannelPlatform,
  type DeliverableType,
} from "@/types";
import { addDeliverableToTopic } from "@/db/actions";
import { cn } from "@/lib/utils";

const TYPES: DeliverableType[] = [
  "long_video",
  "short_video",
  "blog_post",
  "long_post",
  "thread",
];

export function AddDeliverableButton({ topicId }: { topicId: string }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [type, setType] = useState<DeliverableType | null>(null);
  const [channels, setChannels] = useState<ChannelPlatform[]>([]);
  const [pending, startTransition] = useTransition();

  function pick(t: DeliverableType) {
    setType(t);
    setChannels(DELIVERABLE_TYPE_CHANNELS[t]);
  }

  function toggle(c: ChannelPlatform) {
    setChannels((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function reset() {
    setOpen(false);
    setConfirming(false);
    setType(null);
    setChannels([]);
  }

  function submit() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    if (!type || channels.length === 0) return;
    startTransition(async () => {
      await addDeliverableToTopic(topicId, type, channels);
      reset();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border bg-surface text-sm font-medium hover:bg-surface-hover transition-colors shrink-0"
      >
        <Plus className="w-4 h-4" />
        Add Deliverable
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-surface rounded-lg border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-base font-semibold">Add Deliverable</h3>
          <button
            type="button"
            onClick={reset}
            className="p-1 rounded hover:bg-surface-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {!confirming && (
            <>
              <p className="text-xs text-text-muted">
                Pick deliverable type. Multi-channel cho Short Video / Long Post.
              </p>
              {TYPES.map((t) => {
                const valid = DELIVERABLE_TYPE_CHANNELS[t];
                const active = type === t;
                return (
                  <div
                    key={t}
                    className={cn(
                      "rounded-lg border p-3 cursor-pointer transition-colors",
                      active
                        ? "border-accent bg-accent/5"
                        : "border-border bg-surface hover:border-accent"
                    )}
                    onClick={() => pick(t)}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-sm font-medium">
                        {DELIVERABLE_TYPE_LABEL[t]}
                      </div>
                      {active && (
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                      )}
                    </div>
                    {active && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {valid.map((c) => {
                          const checked = channels.includes(c);
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggle(c);
                              }}
                              className={cn(
                                "text-xs px-2 py-1 rounded border transition-colors",
                                checked
                                  ? "border-accent bg-accent text-accent-fg font-medium"
                                  : "border-border bg-bg hover:border-accent"
                              )}
                            >
                              {checked && "✓ "}
                              {CHANNEL_LABEL[c]}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {confirming && type && (
            <div className="text-center py-4">
              <div className="text-base font-medium mb-2">
                Add {DELIVERABLE_TYPE_LABEL[type]}?
              </div>
              <div className="text-sm text-text-muted mb-4">
                Sẽ tạo {channels.length} channel
                {channels.length > 1 ? "s" : ""}:{" "}
                {channels.map((c) => CHANNEL_LABEL[c]).join(", ")}
              </div>
              <div className="text-xs text-text-subtle">
                Tasks tự spawn theo template + auto-assign theo default role.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <button
            type="button"
            onClick={() => (confirming ? setConfirming(false) : reset())}
            className="text-sm text-text-muted hover:text-text"
          >
            {confirming ? "← Back" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!type || channels.length === 0 || pending}
            className="px-4 py-2 rounded-md bg-accent text-accent-fg text-sm font-medium hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending
              ? "Adding..."
              : confirming
                ? "Yes, add"
                : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}
