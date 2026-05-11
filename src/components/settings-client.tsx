"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronRight, Save, Loader2, CheckCircle2 } from "lucide-react";
import { CHANNEL_LABEL, type Channel, type User } from "@/types";
import { updateWorkspaceSettings } from "@/db/actions";
import { cn } from "@/lib/utils";

export function SettingsClient({
  channels,
  users,
  initialBlockReason,
}: {
  channels: Channel[];
  users: User[];
  initialBlockReason: "name" | "role";
}) {
  const [blockReasonDisplay, setBlockReasonDisplay] = useState(initialBlockReason);
  const [saving, startSave] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function save() {
    startSave(async () => {
      await updateWorkspaceSettings({
        blockReasonDisplay,
      });
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2000);
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-5 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-text-muted mt-1">
          Workspace · {users.length} members
        </p>
      </div>

      {/* Team Members link */}
      <Link
        href="/settings/members"
        className="block bg-surface rounded-lg border border-border hover:border-accent/40 transition-colors px-4 py-3 group"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[14px] font-semibold mb-0.5">
              Team Members ({users.length})
            </div>
            <div className="text-[12px] text-text-muted">
              Add / edit / remove members · assign roles
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-subtle group-hover:text-accent" />
        </div>
      </Link>


      <section className="bg-surface rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Display Preferences</h2>
        </div>
        <div className="px-4 py-3">
          <div className="text-sm font-medium mb-2">Block reason format</div>
          <p className="text-xs text-text-muted mb-3">
            Cách hiển thị "ai đang giữ task" trên Dashboard.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBlockReasonDisplay("name")}
              className={cn(
                "flex-1 px-3 py-2 rounded-md border text-sm text-left transition-colors",
                blockReasonDisplay === "name"
                  ? "border-accent bg-accent/5"
                  : "border-border bg-bg hover:bg-surface-hover"
              )}
            >
              <div className="font-medium">Name</div>
              <div className="text-xs text-text-muted mt-0.5">
                "waiting Hoa — post copy review"
              </div>
            </button>
            <button
              type="button"
              onClick={() => setBlockReasonDisplay("role")}
              className={cn(
                "flex-1 px-3 py-2 rounded-md border text-sm text-left transition-colors",
                blockReasonDisplay === "role"
                  ? "border-accent bg-accent/5"
                  : "border-border bg-bg hover:bg-surface-hover"
              )}
            >
              <div className="font-medium">Role</div>
              <div className="text-xs text-text-muted mt-0.5">
                "waiting copywriter — post copy review"
              </div>
            </button>
          </div>
        </div>
      </section>

      <section className="bg-surface rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Channels</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Style notes per channel — team reference khi viết title/description/caption.
          </p>
        </div>
        <div className="divide-y divide-border">
          {channels.map((channel) => (
            <Link
              key={channel.id}
              href={`/settings/channels/${channel.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors"
            >
              <div>
                <div className="text-sm font-medium">{channel.name}</div>
                <div className="text-xs text-text-muted mt-0.5">
                  {CHANNEL_LABEL[channel.platform]}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-subtle" />
            </Link>
          ))}
        </div>
      </section>

      <div className="flex justify-end items-center gap-3">
        {savedAt && (
          <span className="text-sm text-success inline-flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Saved
          </span>
        )}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-accent text-accent-fg text-sm font-medium hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>
    </div>
  );
}

