"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Plus,
  X,
  Link as LinkIcon,
} from "lucide-react";
import {
  CHANNEL_LABEL,
  DELIVERABLE_TYPE_CHANNELS,
  DELIVERABLE_TYPE_LABEL,
  type Channel,
  type ChannelPlatform,
  type DeliverableType,
} from "@/types";
import { toast } from "sonner";
import { createTopic } from "@/db/actions";
import { isValidUrl } from "@/lib/url";
import { cn } from "@/lib/utils";

const DELIVERABLE_DESCRIPTIONS: Record<DeliverableType, string> = {
  long_video: "Horizontal video, 5-30 phút",
  short_video: "Vertical video, ≤60-90s — multi-channel",
  blog_post: "Article 800-2000 từ, Markdown",
  long_post: "Text post 200-500 từ, multi-channel",
  thread: "5-15 numbered tweets",
};

const DELIVERABLE_TYPES: DeliverableType[] = [
  "long_video",
  "short_video",
  "blog_post",
  "long_post",
  "thread",
];

interface MaterialLink {
  url: string;
  label: string;
}

export function NewTopicForm({ channels }: { channels: Channel[] }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [brief, setBrief] = useState("");
  const [links, setLinks] = useState<MaterialLink[]>([{ url: "", label: "" }]);
  const [selected, setSelected] = useState<
    Record<DeliverableType, ChannelPlatform[]>
  >({
    long_video: [],
    short_video: [],
    blog_post: [],
    long_post: [],
    thread: [],
  });
  const [pending, startTransition] = useTransition();

  const totalDeliverables = DELIVERABLE_TYPES.filter(
    (t) => selected[t].length > 0
  ).length;

  const validLinks = links.filter((l) => l.url.trim() && isValidUrl(l.url));
  // Show inline errors for partially-filled but invalid URLs.
  const linkErrors = links.map((l) =>
    l.url.trim() && !isValidUrl(l.url)
      ? "Must start with http:// or https://"
      : null
  );
  const hasInvalidLink = linkErrors.some(Boolean);
  const canContinue = name.trim() && validLinks.length > 0 && !hasInvalidLink;

  function toggleChannel(type: DeliverableType, channel: ChannelPlatform) {
    setSelected((prev) => {
      const current = prev[type];
      const next = current.includes(channel)
        ? current.filter((c) => c !== channel)
        : [...current, channel];
      return { ...prev, [type]: next };
    });
  }

  function addLink() {
    setLinks([...links, { url: "", label: "" }]);
  }

  function updateLink(idx: number, field: "url" | "label", value: string) {
    setLinks(links.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  }

  function removeLink(idx: number) {
    if (links.length === 1) {
      setLinks([{ url: "", label: "" }]);
      return;
    }
    setLinks(links.filter((_, i) => i !== idx));
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await createTopic({
        name,
        brief: brief || undefined,
        materialLinks: validLinks,
        deliverables: selected,
      });
      toast.success(`Created "${name}"`);
      router.push(`/topics/${result.topicId}`);
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-5">
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[13px] text-text-muted hover:text-text mb-3"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          Back to Dashboard
        </Link>
        <h1 className="text-title-2 text-text">New topic</h1>
      </div>

      <div className="flex items-center gap-3 mb-6 text-[14px]">
        <div
          className={cn(
            "flex items-center gap-2",
            step === 1 ? "text-text font-medium" : "text-text-muted"
          )}
        >
          <span
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-semibold",
              step === 1
                ? "bg-accent text-accent-fg"
                : "bg-success-bg text-success"
            )}
          >
            {step === 1 ? "1" : "✓"}
          </span>
          Brief & material
        </div>
        <div className="w-10 h-px bg-border" />
        <div
          className={cn(
            "flex items-center gap-2",
            step === 2 ? "text-text font-medium" : "text-text-muted"
          )}
        >
          <span
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-semibold",
              step === 2
                ? "bg-accent text-accent-fg"
                : "bg-surface-elevated text-text-muted"
            )}
          >
            2
          </span>
          Pick deliverables
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-[14px] font-medium text-text mb-2">
              Topic name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tax increase 10%"
              className="w-full px-3.5 py-2.5 text-[15px]"
            />
          </div>

          <div>
            <label className="block text-[14px] font-medium text-text mb-2">
              Brief
              <span className="text-text-subtle font-normal ml-2">
                What the team needs to know
              </span>
            </label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Record one 12-min take on SME impact. At 3min, mention Linh's café. Analytical tone, blunt."
              rows={4}
              className="w-full px-3.5 py-2.5 text-[14px] resize-none"
            />
          </div>

          <div>
            <label className="block text-[14px] font-medium text-text mb-2">
              Material links
              <span className="text-text-subtle font-normal ml-2">
                Drive / Dropbox / Notion folder with source video + assets
              </span>
            </label>

            <div className="bg-surface border border-border rounded-xl p-3 space-y-3">
              {links.map((link, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-text-subtle shrink-0" strokeWidth={1.75} />
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => updateLink(idx, "url", e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="flex-1 min-w-0 px-3 py-2 text-[14px]"
                    />
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateLink(idx, "label", e.target.value)}
                      placeholder="label"
                      className="w-32 px-3 py-2 text-[14px]"
                    />
                    <button
                      type="button"
                      onClick={() => removeLink(idx)}
                      className="p-2 rounded-full text-text-subtle hover:text-warn hover:bg-surface-hover transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {linkErrors[idx] && (
                    <p className="text-[12px] text-danger mt-1.5 ml-6">
                      {linkErrors[idx]}
                    </p>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addLink}
                className="flex items-center gap-1.5 text-[12px] text-text-muted hover:text-accent px-2 py-1"
              >
                <Plus className="w-3 h-3" />
                Add another link
              </button>
            </div>
            <p className="text-[12px] text-text-subtle mt-1.5">
              Creator share folder chứa source video + reference images. Team
              click link để truy cập material.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canContinue}
              className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded text-[13px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Pick Deliverables
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div className="bg-info-bg border border-info/30 rounded px-3 py-2 text-[13px] text-info">
            Pick formats mày muốn repurpose. 1 source → N outputs across N channels.
          </div>

          {DELIVERABLE_TYPES.map((type) => {
            const validChannels = DELIVERABLE_TYPE_CHANNELS[type];
            const checkedChannels = selected[type];
            const isAnyChecked = checkedChannels.length > 0;

            return (
              <div
                key={type}
                className={cn(
                  "rounded border p-3 transition-colors",
                  isAnyChecked
                    ? "border-accent bg-accent/5"
                    : "border-border bg-surface"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-[14px] font-medium">
                      {DELIVERABLE_TYPE_LABEL[type]}
                    </div>
                    <div className="text-[12px] text-text-muted mt-0.5">
                      {DELIVERABLE_DESCRIPTIONS[type]}
                    </div>
                  </div>
                  {isAnyChecked && (
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-accent text-accent-fg font-semibold">
                      {checkedChannels.length} channel
                      {checkedChannels.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {validChannels.map((channelPlatform) => {
                    const channel = channels.find(
                      (c) => c.platform === channelPlatform
                    );
                    if (!channel) return null;
                    const checked = checkedChannels.includes(channelPlatform);
                    return (
                      <button
                        key={channelPlatform}
                        type="button"
                        onClick={() => toggleChannel(type, channelPlatform)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-[12px] font-medium transition-colors",
                          checked
                            ? "border-accent bg-accent text-accent-fg"
                            : "border-border bg-surface hover:border-accent text-text"
                        )}
                      >
                        {checked && <CheckCircle2 className="w-3 h-3" />}
                        {CHANNEL_LABEL[channelPlatform]}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[13px] text-text-muted hover:text-text"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={totalDeliverables === 0 || pending}
              className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded text-[13px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create {totalDeliverables} Deliverable
                  {totalDeliverables !== 1 ? "s" : ""}
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
