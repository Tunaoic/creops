"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { markChannelAired } from "@/db/actions";

export function MarkAiredButton({
  deliverableChannelId,
}: {
  deliverableChannelId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [link, setLink] = useState("");
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs text-info hover:underline"
      >
        + Mark Aired (paste link)
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <input
        type="url"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="https://..."
        autoFocus
        className="flex-1 min-w-0 px-2 py-1 text-xs rounded border border-border bg-bg focus:outline-none focus:border-accent"
      />
      <button
        type="button"
        disabled={!link.trim() || pending}
        onClick={() => {
          startTransition(async () => {
            await markChannelAired(deliverableChannelId, link);
            setEditing(false);
            setLink("");
          });
        }}
        className="p-1 text-success hover:bg-success-bg rounded disabled:opacity-30"
      >
        <Check className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => {
          setEditing(false);
          setLink("");
        }}
        className="p-1 text-text-muted hover:bg-surface-elevated rounded"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
