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
import { createTopic } from "@/db/actions";
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

  const validLinks = links.filter((l) => l.url.trim());
  const canContinue = name.trim() && validLinks.length > 0;

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
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New Topic</h1>
      </div>

      <div className="flex items-center gap-2 mb-5 text-[13px]">
        <div
          className={cn(
            "flex items-center gap-1.5",
            step === 1 ? "text-text font-medium" : "text-text-muted"
          )}
        >
          <span
            className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono font-bold",
              step === 1
                ? "bg-accent text-accent-fg"
                : "bg-success-bg text-success border border-success/40"
            )}
          >
            {step === 1 ? "1" : "✓"}
          </span>
          Brief & Material
        </div>
        <div className="w-8 h-px bg-border" />
        <div
          className={cn(
            "flex items-center gap-1.5",
            step === 2 ? "text-text font-medium" : "text-text-muted"
          )}
        >
          <span
            className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono font-bold",
              step === 2
                ? "bg-accent text-accent-fg"
                : "bg-surface-elevated text-text-muted border border-border"
            )}
          >
            2
          </span>
          Pick Deliverables
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-mono uppercase tracking-wider text-text-subtle mb-1.5 font-semibold">
              Topic Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="vd: Thuế tăng 10%"
              className="w-full px-3 py-2 rounded border border-border bg-surface text-[14px] focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-[12px] font-mono uppercase tracking-wider text-text-subtle mb-1.5 font-semibold">
              Brief{" "}
              <span className="text-text-subtle/70 normal-case font-sans">
                — what team needs to know
              </span>
            </label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Quay 1 take 12 phút về tác động lên SME. Phút 3 nhắc shop cafe Linh. Tone phân tích thẳng."
              rows={4}
              className="w-full px-3 py-2 rounded border border-border bg-surface text-[13px] focus:outline-none focus:border-accent resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12px] font-mono uppercase tracking-wider text-text-subtle font-semibold">
                Material Links{" "}
                <span className="text-text-subtle/70 normal-case font-sans">
                  — Drive / Dropbox / Notion folder where source video + images live
                </span>
              </label>
            </div>

            <div className="bg-surface border border-border rounded p-3 space-y-2">
              {links.map((link, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <LinkIcon className="w-3.5 h-3.5 text-text-subtle shrink-0" />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => updateLink(idx, "url", e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="flex-1 min-w-0 px-2 py-1.5 rounded border border-border bg-bg text-[13px] focus:outline-none focus:border-accent"
                  />
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => updateLink(idx, "label", e.target.value)}
                    placeholder="label"
                    className="w-32 px-2 py-1.5 rounded border border-border bg-bg text-[13px] focus:outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(idx)}
                    className="p-1.5 text-text-subtle hover:text-warn rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
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
