"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ExternalLink } from "lucide-react";
import { CHANNEL_LABEL, type Topic, type Channel } from "@/types";

export function SearchClient({
  topics,
  channels,
}: {
  topics: Topic[];
  channels: Channel[];
}) {
  const [q, setQ] = useState("");
  const channelMap = new Map(channels.map((c) => [c.id, c]));

  const results = useMemo(() => {
    if (!q.trim()) return null;
    const query = q.toLowerCase();

    const topicMatches = topics.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        (t.brief?.toLowerCase().includes(query) ?? false)
    );

    const linkMatches = topics
      .flatMap((t) =>
        t.deliverables.flatMap((d) =>
          d.channels
            .filter((c) => c.airedLink)
            .map((c) => ({ topic: t, channel: c }))
        )
      )
      .filter(({ topic, channel }) => {
        const ch = channelMap.get(channel.channelId);
        return (
          topic.name.toLowerCase().includes(query) ||
          (ch && CHANNEL_LABEL[ch.platform].toLowerCase().includes(query)) ||
          (channel.airedLink?.toLowerCase().includes(query) ?? false)
        );
      });

    return { topicMatches, linkMatches };
  }, [q, topics, channelMap]);

  return (
    <div className="max-w-3xl mx-auto px-8 py-7 space-y-5">
      <div>
        <h1 className="text-title-2 text-text mb-1">Search</h1>
        <p className="text-[15px] text-text-muted">
          Find topics, briefs, and aired links across your workspace.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" strokeWidth={1.75} />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='Try "branding", "youtube"...'
          autoFocus
          className="w-full pl-11 pr-4 py-3 text-[16px]"
        />
      </div>

      {!q.trim() ? (
        <div className="text-[14px] text-text-subtle py-6 text-center">
          Type to search
        </div>
      ) : !results ||
        (results.topicMatches.length === 0 &&
          results.linkMatches.length === 0) ? (
        <div className="text-[14px] text-text-subtle py-6 text-center">
          No results for &ldquo;{q}&rdquo;
        </div>
      ) : (
        <div className="space-y-5">
          {results.topicMatches.length > 0 && (
            <section>
              <h2 className="text-headline text-text mb-3 flex items-baseline gap-2">
                Topics
                <span className="text-[14px] text-text-subtle font-normal tabular-nums">
                  {results.topicMatches.length}
                </span>
              </h2>
              <div className="bg-surface rounded-2xl border border-border overflow-hidden">
                {results.topicMatches.map((topic, idx) => (
                  <Link
                    key={topic.id}
                    href={`/topics/${topic.id}`}
                    className={`block px-5 py-3.5 hover:bg-surface-hover transition-colors ${
                      idx > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <div className="text-[15px] font-medium text-text">{topic.name}</div>
                    {topic.brief && (
                      <div className="text-[13px] text-text-muted truncate mt-1">
                        {topic.brief}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.linkMatches.length > 0 && (
            <section>
              <h2 className="text-headline text-text mb-3 flex items-baseline gap-2">
                Aired links
                <span className="text-[14px] text-text-subtle font-normal tabular-nums">
                  {results.linkMatches.length}
                </span>
              </h2>
              <div className="bg-surface rounded-2xl border border-border overflow-hidden">
                {results.linkMatches.map(({ topic, channel }, idx) => {
                  const ch = channelMap.get(channel.channelId);
                  return (
                    <a
                      key={`${topic.id}-${channel.channelId}`}
                      href={channel.airedLink ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-surface-hover transition-colors ${
                        idx > 0 ? "border-t border-border" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-[15px] font-medium text-text">
                          {topic.name}
                          <span className="text-text-subtle font-normal">
                            {" — "}
                            {ch ? CHANNEL_LABEL[ch.platform] : "?"}
                          </span>
                        </div>
                        <div className="text-[13px] text-info truncate mt-0.5">
                          {channel.airedLink}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-text-subtle shrink-0" strokeWidth={1.75} />
                    </a>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
