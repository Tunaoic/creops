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
    <div className="max-w-3xl mx-auto px-6 py-5 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Search</h1>
        <p className="text-sm text-text-muted">
          Search topics, briefs, aired links across all your work.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='Try: "thuế", "branding", "youtube"...'
          autoFocus
          className="w-full pl-10 pr-3 py-3 rounded-md border border-border bg-surface text-base focus:outline-none focus:border-accent"
        />
      </div>

      {!q.trim() ? (
        <div className="text-sm text-text-subtle italic py-4 text-center">
          Type to search...
        </div>
      ) : !results ||
        (results.topicMatches.length === 0 &&
          results.linkMatches.length === 0) ? (
        <div className="text-sm text-text-subtle italic py-4 text-center">
          No results for "{q}".
        </div>
      ) : (
        <div className="space-y-4">
          {results.topicMatches.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                Topics ({results.topicMatches.length})
              </h2>
              <div className="bg-surface rounded-lg border border-border overflow-hidden">
                {results.topicMatches.map((topic, idx) => (
                  <Link
                    key={topic.id}
                    href={`/topics/${topic.id}`}
                    className={`block px-4 py-3 hover:bg-surface-hover transition-colors ${
                      idx > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <div className="text-sm font-medium">{topic.name}</div>
                    {topic.brief && (
                      <div className="text-xs text-text-muted truncate mt-1">
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
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                Aired Links ({results.linkMatches.length})
              </h2>
              <div className="bg-surface rounded-lg border border-border overflow-hidden">
                {results.linkMatches.map(({ topic, channel }, idx) => {
                  const ch = channelMap.get(channel.channelId);
                  return (
                    <a
                      key={`${topic.id}-${channel.channelId}`}
                      href={channel.airedLink ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors ${
                        idx > 0 ? "border-t border-border" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium">
                          {topic.name} →{" "}
                          {ch ? CHANNEL_LABEL[ch.platform] : "?"}
                        </div>
                        <div className="text-xs text-info truncate mt-0.5">
                          {channel.airedLink}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-text-subtle shrink-0" />
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
