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
    <div className="max-w-3xl mx-auto px-8 py-7 space-y-6">
      <div>
        <h1 className="text-title-2 text-text">Settings</h1>
        <p className="text-[14px] text-text-muted mt-1">
          Workspace · {users.length} {users.length === 1 ? "member" : "members"}
        </p>
      </div>

      {/* Workspaces + Members links */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Link
          href="/settings/workspaces"
          className="block bg-surface rounded-2xl border border-border hover:bg-surface-hover transition-colors px-5 py-4 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[16px] font-medium text-text mb-0.5">
                Workspaces
              </div>
              <div className="text-[13px] text-text-muted">
                Switch, create, leave
              </div>
            </div>
            <ChevronRight
              className="w-4 h-4 text-text-subtle group-hover:text-text transition-colors"
              strokeWidth={1.75}
            />
          </div>
        </Link>

        <Link
          href="/settings/members"
          className="block bg-surface rounded-2xl border border-border hover:bg-surface-hover transition-colors px-5 py-4 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[16px] font-medium text-text mb-0.5">
                Team members
              </div>
              <div className="text-[13px] text-text-muted">
                {users.length} {users.length === 1 ? "member" : "members"} · invite, edit, remove
              </div>
            </div>
            <ChevronRight
              className="w-4 h-4 text-text-subtle group-hover:text-text transition-colors"
              strokeWidth={1.75}
            />
          </div>
        </Link>
      </div>

      <section className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-headline text-text">Display preferences</h2>
        </div>
        <div className="px-5 py-4">
          <div className="text-[15px] font-medium mb-1.5">Block reason format</div>
          <p className="text-[13px] text-text-muted mb-3">
            How "who's holding a task" appears across the dashboard.
          </p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setBlockReasonDisplay("name")}
              className={cn(
                "flex-1 px-4 py-3 rounded-xl border text-left transition-colors",
                blockReasonDisplay === "name"
                  ? "border-accent bg-accent/5"
                  : "border-border bg-surface hover:bg-surface-hover"
              )}
            >
              <div className="text-[14px] font-medium text-text">Name</div>
              <div className="text-[12px] text-text-muted mt-0.5">
                Waiting Hoa — post copy review
              </div>
            </button>
            <button
              type="button"
              onClick={() => setBlockReasonDisplay("role")}
              className={cn(
                "flex-1 px-4 py-3 rounded-xl border text-left transition-colors",
                blockReasonDisplay === "role"
                  ? "border-accent bg-accent/5"
                  : "border-border bg-surface hover:bg-surface-hover"
              )}
            >
              <div className="text-[14px] font-medium text-text">Role</div>
              <div className="text-[12px] text-text-muted mt-0.5">
                Waiting copywriter — post copy review
              </div>
            </button>
          </div>
        </div>
      </section>

      <section className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-headline text-text">Channels</h2>
          <p className="text-[13px] text-text-muted mt-0.5">
            Per-channel style notes — reference for the team when writing titles, descriptions, captions.
          </p>
        </div>
        <div className="divide-y divide-border">
          {channels.map((channel) => (
            <Link
              key={channel.id}
              href={`/settings/channels/${channel.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-surface-hover transition-colors"
            >
              <div>
                <div className="text-[15px] font-medium text-text">{channel.name}</div>
                <div className="text-[13px] text-text-muted mt-0.5">
                  {CHANNEL_LABEL[channel.platform]}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-subtle" strokeWidth={1.75} />
            </Link>
          ))}
        </div>
      </section>

      <div className="flex justify-end items-center gap-3">
        {savedAt && (
          <span className="text-[14px] text-success inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} /> Saved
          </span>
        )}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="btn-primary inline-flex items-center gap-2 text-[14px] disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" strokeWidth={1.75} />
          )}
          Save changes
        </button>
      </div>
    </div>
  );
}

