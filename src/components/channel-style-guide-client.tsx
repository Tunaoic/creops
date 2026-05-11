"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Save, Loader2, CheckCircle2 } from "lucide-react";
import { CHANNEL_LABEL, type Channel } from "@/types";
import { updateChannelStyleGuide } from "@/db/actions";
import { cn } from "@/lib/utils";

const CONTENT_TYPES = [
  { key: "title", label: "Title" },
  { key: "description", label: "Description" },
  { key: "caption", label: "Caption" },
  { key: "tags", label: "Tags / Hashtags" },
];

export function ChannelStyleGuideClient({
  channel,
  initialGuides,
}: {
  channel: Channel;
  initialGuides: Record<string, { samples: string[]; promptOverride: string | null }>;
}) {
  const [activeTab, setActiveTab] = useState("description");
  const [guides, setGuides] = useState(initialGuides);
  const [saving, startSave] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const current = guides[activeTab] ?? { samples: [], promptOverride: null };

  function updateField(
    field: "samples" | "promptOverride",
    value: string[] | string | null
  ) {
    setGuides({
      ...guides,
      [activeTab]: {
        samples: field === "samples" ? (value as string[]) : current.samples,
        promptOverride:
          field === "promptOverride" ? (value as string | null) : current.promptOverride,
      },
    });
  }

  function addSample() {
    updateField("samples", [...current.samples, ""]);
  }

  function updateSample(idx: number, value: string) {
    updateField(
      "samples",
      current.samples.map((s, i) => (i === idx ? value : s))
    );
  }

  function removeSample(idx: number) {
    updateField(
      "samples",
      current.samples.filter((_, i) => i !== idx)
    );
  }

  function save() {
    startSave(async () => {
      await updateChannelStyleGuide({
        channelId: channel.id,
        contentType: activeTab,
        samples: current.samples.filter((s) => s.trim()),
        promptOverride: current.promptOverride ?? undefined,
      });
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2000);
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-5 space-y-4">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>
        <h1 className="text-xl font-semibold">{channel.name}</h1>
        <p className="text-sm text-text-muted mt-1">
          {CHANNEL_LABEL[channel.platform]} · Style Guide
        </p>
      </div>

      <div className="bg-info-bg/40 border border-info/30 rounded-lg px-4 py-3 text-sm text-info">
        <Sparkles className="w-4 h-4 inline mr-1" />
        Reference cho team — paste sample title/description/caption hay từ channel
        này để copywriter dựa theo. Giữ voice nhất quán across team.
      </div>

      <div className="flex gap-1 border-b border-border">
        {CONTENT_TYPES.map((ct) => (
          <button
            key={ct.key}
            type="button"
            onClick={() => setActiveTab(ct.key)}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === ct.key
                ? "border-accent text-accent"
                : "border-transparent text-text-muted hover:text-text"
            )}
          >
            {ct.label}
            {(guides[ct.key]?.samples?.length ?? 0) > 0 && (
              <span className="ml-1 text-xs px-1 rounded bg-accent/20 text-accent">
                {guides[ct.key].samples.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">
            Sample {activeTab}s ({current.samples.length})
          </h2>
          <button
            type="button"
            onClick={addSample}
            className="text-xs px-2 py-1 rounded border border-border hover:bg-surface-hover"
          >
            + Add Sample
          </button>
        </div>
        <p className="text-xs text-text-muted mb-3">
          Paste 3-5 examples từ channel mày để AI học style.
        </p>

        {current.samples.length === 0 ? (
          <div className="text-sm text-text-subtle italic py-5 text-center bg-surface rounded-lg border border-border">
            Chưa có sample. Click "Add Sample" để paste ví dụ.
          </div>
        ) : (
          <div className="space-y-3">
            {current.samples.map((sample, idx) => (
              <div
                key={idx}
                className="bg-surface rounded-lg border border-border overflow-hidden"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-bg">
                  <span className="text-xs text-text-muted">
                    Sample {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSample(idx)}
                    className="text-xs text-text-muted hover:text-warn-text"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  value={sample}
                  onChange={(e) => updateSample(idx, e.target.value)}
                  rows={6}
                  placeholder="Paste sample ở đây..."
                  className="w-full px-3 py-2 bg-surface text-sm font-mono leading-relaxed focus:outline-none resize-none"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">
          Style Notes{" "}
          <span className="font-normal text-text-muted text-xs">(optional)</span>
        </h2>
        <p className="text-xs text-text-muted mb-3">
          Mô tả format, tone, structure cho team. Vd: "Description bắt đầu bằng
          hook 2 câu, có timestamps, kết bằng CTA subscribe."
        </p>
        <textarea
          value={current.promptOverride ?? ""}
          onChange={(e) => updateField("promptOverride", e.target.value || null)}
          rows={5}
          className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm focus:outline-none focus:border-accent resize-none"
        />
      </section>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
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
          Save Guide
        </button>
      </div>
    </div>
  );
}
