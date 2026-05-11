"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import type { User } from "@/types";
import { cn } from "@/lib/utils";

export function AssigneeMultiSelect({
  members,
  onConfirm,
  onCancel,
}: {
  members: User[];
  onConfirm: (ids: string[]) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {members.map((m) => {
        const checked = selected.has(m.id);
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => toggle(m.id)}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[12px] transition-colors",
              checked
                ? "border-accent bg-accent text-accent-fg"
                : "border-border bg-bg hover:border-accent text-text"
            )}
          >
            {checked && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
            <span className="w-3.5 h-3.5 rounded-full bg-surface-elevated border border-border-strong flex items-center justify-center text-[8px] font-mono font-bold text-accent">
              {m.name[0]?.toUpperCase()}
            </span>
            {m.name}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => onConfirm(Array.from(selected))}
        disabled={selected.size === 0}
        className="ml-1 px-2 py-0.5 rounded bg-accent text-accent-fg text-[11px] font-semibold disabled:opacity-40"
      >
        Apply ({selected.size})
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-1 text-text-muted hover:text-text"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
