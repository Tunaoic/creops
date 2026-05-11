"use client";

import { useState, useTransition } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { markChannelAired } from "@/db/actions";
import { isValidUrl } from "@/lib/url";

export function MarkAiredButton({
  deliverableChannelId,
}: {
  deliverableChannelId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [link, setLink] = useState("");
  const [pending, startTransition] = useTransition();

  const trimmed = link.trim();
  const urlError =
    trimmed.length > 0 && !isValidUrl(trimmed)
      ? "Must start with http:// or https://"
      : null;

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-[13px] text-info hover:underline"
      >
        + Mark aired (paste link)
      </button>
    );
  }

  function submit() {
    if (urlError) {
      toast.error(urlError);
      return;
    }
    startTransition(async () => {
      const result = await markChannelAired(deliverableChannelId, link);
      if (result.ok) {
        toast.success("Marked as aired");
        setEditing(false);
        setLink("");
      } else {
        toast.error(result.reason);
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <input
        type="url"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="https://..."
        autoFocus
        className="flex-1 min-w-0 px-2.5 py-1.5 text-[13px]"
      />
      <button
        type="button"
        disabled={!link.trim() || pending || urlError !== null}
        onClick={submit}
        className="p-1.5 rounded-full text-success hover:bg-success-bg disabled:opacity-30"
        title="Save"
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Check className="w-3.5 h-3.5" strokeWidth={2.25} />
        )}
      </button>
      <button
        type="button"
        onClick={() => {
          setEditing(false);
          setLink("");
        }}
        className="p-1.5 rounded-full text-text-muted hover:bg-surface-hover"
        title="Cancel"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
