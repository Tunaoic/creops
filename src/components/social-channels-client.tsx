"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Check,
  Clock,
  Construction,
  ExternalLink,
  Eye,
  Info,
  Loader2,
  Plug,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  connectSocialChannel,
  disconnectSocialChannel,
} from "@/db/actions";
import {
  SOCIAL_PLATFORMS,
  type SocialAccount,
  type SocialPlatform,
  type SocialPlatformDef,
} from "@/types";
import { cn } from "@/lib/utils";

/**
 * Phase 3a UI — connection management + future reporting placeholder.
 *
 * Sections:
 *   1. Read-only banner — sets expectation (we never post on your behalf)
 *   2. Connected channels list (empty by default)
 *   3. Available platforms grid (YouTube enabled, others Coming Soon)
 *   4. Phase 3 roadmap note — tells user what's wired vs what's coming
 *
 * No metrics yet — Phase 3c brings those.
 */
export function SocialChannelsClient({
  accounts,
}: {
  accounts: SocialAccount[];
}) {
  // Group connected accounts by platform so the platform card can show
  // "Connected: ChannelName" inline instead of a separate list.
  const accountsByPlatform = new Map<SocialPlatform, SocialAccount[]>();
  for (const a of accounts) {
    const list = accountsByPlatform.get(a.platform) ?? [];
    list.push(a);
    accountsByPlatform.set(a.platform, list);
  }

  const connectedCount = accounts.length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-5 space-y-5">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[14px] text-text-muted hover:text-text mb-4"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          Back to Dashboard
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-title-2 text-text flex items-center gap-2.5">
              <BarChart3
                className="w-6 h-6 text-text-muted"
                strokeWidth={1.5}
              />
              Social channels
            </h1>
            <p className="text-[14px] text-text-muted mt-1 max-w-2xl">
              Connect the platforms where you publish so CreOps can pull
              performance metrics back into each topic and deliverable.
              Read-only — we never post on your behalf.
            </p>
          </div>
        </div>
      </div>

      {/* Read-only expectation banner */}
      <div className="bg-info-bg/60 rounded-2xl px-4 py-3 text-[13px] text-info flex items-start gap-2.5">
        <Eye className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.75} />
        <div>
          <strong className="font-semibold">Read-only access.</strong>{" "}
          <span className="text-info/85">
            We pull views, watch time, likes, comments — never post,
            edit, or delete. You can revoke access from the platform
            settings at any time.
          </span>
        </div>
      </div>

      {/* Connected channels — only shown when there's at least one */}
      {connectedCount > 0 && (
        <section className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-headline text-text flex items-baseline gap-2">
              Connected
              <span className="text-[14px] text-text-subtle font-normal tabular-nums">
                {connectedCount}
              </span>
            </h2>
          </div>
          <div className="divide-y divide-border">
            {accounts.map((a) => (
              <ConnectedRow key={`${a.platform}:${a.accountId}`} account={a} />
            ))}
          </div>
        </section>
      )}

      {/* Platforms grid */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-headline text-text">Available platforms</h2>
          <span className="text-[12px] text-text-subtle">
            More coming as we get API approval
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SOCIAL_PLATFORMS.map((p) => (
            <PlatformCard
              key={p.id}
              platform={p}
              connectedAccounts={accountsByPlatform.get(p.id) ?? []}
            />
          ))}
        </div>
      </section>

      {/* Phase 3 roadmap — sets expectations transparently */}
      <section className="bg-surface/60 rounded-2xl border border-border px-5 py-4">
        <div className="flex items-start gap-3">
          <Construction
            className="w-4 h-4 text-text-muted mt-0.5 shrink-0"
            strokeWidth={1.75}
          />
          <div className="flex-1">
            <h3 className="text-[14px] font-semibold text-text mb-2">
              What&apos;s shipping
            </h3>
            <ul className="text-[13px] text-text-muted space-y-1.5">
              <li>
                <strong className="text-text">Phase 3a (now):</strong> UI
                + connection schema. Demo connections so you can preview
                the flow.
              </li>
              <li>
                <strong className="text-text">Phase 3b:</strong> Real
                Google OAuth — connect your YouTube channel for real.
              </li>
              <li>
                <strong className="text-text">Phase 3c:</strong> Auto-pull
                views / watch time / likes per aired video, surfaced on
                each deliverable.
              </li>
              <li>
                <strong className="text-text">Phase 3d:</strong> Aggregate
                report — top topics, channel-level trends, time-range
                comparisons.
              </li>
              <li>
                <strong className="text-text">Phase 3e+:</strong> Add
                TikTok / Meta / others as their API approvals land.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function PlatformCard({
  platform,
  connectedAccounts,
}: {
  platform: SocialPlatformDef;
  connectedAccounts: SocialAccount[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const submittingRef = useRef(false);

  const connected = connectedAccounts.length > 0;
  const isDemo = connectedAccounts.some(
    (a) => a.status === "expired" || a.metadata?.demo === true
  );

  function handleConnect() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    startTransition(async () => {
      try {
        const result = await connectSocialChannel({ platform: platform.id });
        if (!result.ok) {
          toast.error(result.reason ?? "Couldn't connect");
          return;
        }
        if (result.isDemo) {
          toast.success(`${platform.label} connected (demo)`, {
            description:
              "OAuth is wiring up in Phase 3b — this is a placeholder so you can preview the UX.",
            duration: 7000,
          });
        } else {
          toast.success(`${platform.label} connected`);
        }
        router.refresh();
      } finally {
        submittingRef.current = false;
      }
    });
  }

  return (
    <div
      className={cn(
        "rounded-2xl border bg-surface px-5 py-4 flex flex-col gap-3 transition-colors",
        connected
          ? "border-accent/40 bg-accent/5"
          : platform.available
            ? "border-border hover:border-border-strong"
            : "border-border opacity-70"
      )}
    >
      <div className="flex items-start gap-3">
        <PlatformGlyph platform={platform.id} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] font-semibold text-text">
              {platform.label}
            </h3>
            {connected && !isDemo && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-accent text-accent inline-flex items-center gap-1">
                <Check className="w-3 h-3" strokeWidth={2.5} />
                Connected
              </span>
            )}
            {isDemo && (
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-warn-border text-warn"
                title="Phase 3a placeholder — real OAuth in Phase 3b"
              >
                Demo
              </span>
            )}
            {!platform.available && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-border text-text-subtle">
                Coming soon
              </span>
            )}
          </div>
          <p className="text-[13px] text-text-muted mt-1 leading-relaxed">
            {platform.description}
          </p>
          {!platform.available && platform.comingSoonReason && (
            <p className="text-[12px] text-text-subtle mt-2 inline-flex items-start gap-1.5">
              <Info className="w-3 h-3 mt-0.5 shrink-0" strokeWidth={1.75} />
              {platform.comingSoonReason}
            </p>
          )}
        </div>
      </div>

      {/* Connected accounts list (compact, when applicable) */}
      {connectedAccounts.length > 0 && (
        <div className="border-t border-border/60 pt-3 space-y-1.5">
          {connectedAccounts.map((a) => (
            <div
              key={a.accountId}
              className="flex items-center gap-2 text-[13px]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-text font-medium truncate">
                {a.accountHandle}
              </span>
              {a.lastSyncedAt ? (
                <span className="text-[11px] text-text-subtle ml-auto inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  synced {timeAgo(a.lastSyncedAt)}
                </span>
              ) : (
                <span className="text-[11px] text-text-subtle ml-auto">
                  not synced yet
                </span>
              )}
              <DisconnectButton
                platform={a.platform}
                accountId={a.accountId}
                handle={a.accountHandle}
              />
            </div>
          ))}
        </div>
      )}

      {/* Action button */}
      <div className="flex items-center justify-between gap-2">
        {platform.available ? (
          <button
            type="button"
            onClick={handleConnect}
            disabled={pending}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors disabled:opacity-50",
              connected
                ? "border border-border text-text-muted hover:bg-surface-hover"
                : "btn-primary"
            )}
          >
            {pending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : connected ? (
              <Plus className="w-3.5 h-3.5" />
            ) : (
              <Plug className="w-3.5 h-3.5" />
            )}
            {connected ? "Add another account" : "Connect"}
          </button>
        ) : (
          <span className="text-[12px] text-text-subtle">
            Available later this round
          </span>
        )}
      </div>
    </div>
  );
}

function DisconnectButton({
  platform,
  accountId,
  handle,
}: {
  platform: SocialPlatform;
  accountId: string;
  handle: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDisconnect() {
    startTransition(async () => {
      const result = await disconnectSocialChannel({ platform, accountId });
      if (!result.ok) {
        toast.error(result.reason ?? "Couldn't disconnect");
        return;
      }
      toast.success(`Disconnected ${handle}`);
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-0.5">
        <button
          type="button"
          onClick={handleDisconnect}
          disabled={pending}
          className="p-1 rounded text-warn hover:bg-warn-bg disabled:opacity-50"
          title="Confirm disconnect"
        >
          {pending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Check className="w-3 h-3" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="p-1 rounded text-text-subtle hover:bg-surface-hover"
          title="Cancel"
        >
          <X className="w-3 h-3" />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="p-1 rounded text-text-muted hover:text-warn hover:bg-warn-bg"
      title="Disconnect"
    >
      <Trash2 className="w-3 h-3" />
    </button>
  );
}

function ConnectedRow({ account }: { account: SocialAccount }) {
  const platformDef = SOCIAL_PLATFORMS.find((p) => p.id === account.platform);
  const isDemo =
    account.status === "expired" || account.metadata?.demo === true;
  return (
    <div className="px-5 py-3 flex items-center gap-3">
      <PlatformGlyph platform={account.platform} small />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-medium text-text truncate">
            {account.accountHandle}
          </span>
          <span className="text-[11px] text-text-subtle">
            {platformDef?.label ?? account.platform}
          </span>
          {isDemo && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-warn-border text-warn">
              Demo
            </span>
          )}
        </div>
        <div className="text-[12px] text-text-subtle mt-0.5">
          Connected {timeAgo(account.connectedAt)}
          {" · "}
          {account.lastSyncedAt
            ? `synced ${timeAgo(account.lastSyncedAt)}`
            : "not synced yet"}
        </div>
      </div>
      <DisconnectButton
        platform={account.platform}
        accountId={account.accountId}
        handle={account.accountHandle}
      />
    </div>
  );
}

function PlatformGlyph({
  platform,
  small,
}: {
  platform: SocialPlatform;
  small?: boolean;
}) {
  // Brand-tinted square — keeps the platform recognizable without
  // depending on platform logos (licensing + dark-theme contrast).
  const bg: Record<SocialPlatform, string> = {
    youtube: "bg-[oklch(58%_0.21_25)]/15 text-[oklch(58%_0.21_25)]",
    tiktok: "bg-[oklch(78%_0.18_180)]/15 text-[oklch(60%_0.18_200)]",
    instagram: "bg-[oklch(60%_0.22_340)]/15 text-[oklch(60%_0.22_340)]",
    facebook: "bg-[oklch(55%_0.20_260)]/15 text-[oklch(55%_0.20_260)]",
  };
  const letter: Record<SocialPlatform, string> = {
    youtube: "Y",
    tiktok: "T",
    instagram: "I",
    facebook: "F",
  };
  return (
    <span
      className={cn(
        "rounded-lg flex items-center justify-center font-bold shrink-0",
        bg[platform],
        small ? "w-8 h-8 text-[13px]" : "w-10 h-10 text-[15px]"
      )}
    >
      {letter[platform]}
    </span>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
