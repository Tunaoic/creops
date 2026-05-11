"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Loader2, Trash2, Send } from "lucide-react";
import type { Comment } from "@/db/queries";
import type { User } from "@/types";
import { addComment, removeComment } from "@/db/actions";
import { formatRelativeTime, cn } from "@/lib/utils";

export function CommentThread({
  targetType,
  targetId,
  comments,
  members,
  currentUserId,
}: {
  targetType: "topic" | "deliverable" | "task" | "asset";
  targetId: string;
  comments: Comment[];
  members: User[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number>(0);
  const [mentionedIds, setMentionedIds] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const memberMap = new Map(members.map((m) => [m.id, m]));

  const filteredMembers =
    mentionQuery !== null
      ? members.filter((m) =>
          m.name.toLowerCase().includes(mentionQuery.toLowerCase())
        )
      : [];

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setBody(val);

    // Detect @ mention trigger
    const cursorPos = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      setMentionStart(cursorPos - atMatch[0].length);
      setMentionQuery(atMatch[1]);
    } else {
      setMentionQuery(null);
    }
  }

  function insertMention(member: User) {
    if (mentionQuery === null) return;
    const before = body.slice(0, mentionStart);
    const after = body.slice(mentionStart + 1 + mentionQuery.length);
    const inserted = `@${member.name.replace(/\s+/g, "")} `;
    const next = before + inserted + after;
    setBody(next);
    setMentionedIds(new Set([...mentionedIds, member.id]));
    setMentionQuery(null);
    // Refocus textarea + place cursor after inserted mention
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        const newPos = (before + inserted).length;
        el.setSelectionRange(newPos, newPos);
      }
    });
  }

  function submit() {
    if (!body.trim()) return;
    // Re-scan body to include only members actually @-named in final text
    const finalMentions = members
      .filter((m) =>
        body.includes(`@${m.name.replace(/\s+/g, "")}`)
      )
      .map((m) => m.id);
    startTransition(async () => {
      await addComment({
        targetType,
        targetId,
        body,
        mentions: finalMentions,
      });
      setBody("");
      setMentionedIds(new Set());
      router.refresh();
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery !== null && filteredMembers.length > 0) {
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredMembers[0]);
        return;
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        return;
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  return (
    <section className="bg-surface rounded border border-border overflow-hidden">
      <div className="px-3 py-2 border-b border-border bg-bg/40 flex items-center gap-2">
        <MessageSquare className="w-3.5 h-3.5 text-text-subtle" />
        <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.15em] text-text-subtle">
          Comments
        </span>
        {comments.length > 0 && (
          <span className="text-[10px] font-mono text-text-subtle px-1.5 py-0.5 rounded bg-surface-elevated">
            {comments.length}
          </span>
        )}
      </div>

      {comments.length > 0 && (
        <div className="divide-y divide-border">
          {comments.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              author={c.authorId ? memberMap.get(c.authorId) : undefined}
              members={members}
              currentUserId={currentUserId}
              isOwn={c.authorId === currentUserId}
              onDelete={() => {
                startTransition(async () => {
                  await removeComment(c.id);
                  router.refresh();
                });
              }}
            />
          ))}
        </div>
      )}

      <div className="p-3 border-t border-border relative">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={onChange}
          onKeyDown={onKeyDown}
          rows={2}
          placeholder="Add a comment... (@ to mention, ⌘↵ to send)"
          className="w-full px-3 py-2 rounded border border-border bg-bg text-[13px] focus:outline-none focus:border-accent resize-none"
        />

        {/* Mention dropdown */}
        {mentionQuery !== null && filteredMembers.length > 0 && (
          <div className="absolute left-3 right-3 bottom-full mb-1 bg-surface rounded border border-border-strong shadow-xl z-30 max-h-[180px] overflow-y-auto">
            <div className="px-3 py-1.5 border-b border-border bg-bg/40 text-[10px] font-mono font-semibold uppercase tracking-wider text-text-subtle">
              Mention
            </div>
            {filteredMembers.slice(0, 6).map((m, idx) => (
              <button
                key={m.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(m);
                }}
                className={cn(
                  "w-full text-left px-3 py-1.5 flex items-center gap-2 text-[13px] hover:bg-surface-hover transition-colors",
                  idx === 0 && "bg-accent/5"
                )}
              >
                <span className="w-5 h-5 rounded-full bg-surface-elevated border border-border-strong flex items-center justify-center text-[10px] font-mono font-bold text-accent shrink-0">
                  {m.name[0]?.toUpperCase()}
                </span>
                <span className="flex-1 min-w-0 truncate">{m.name}</span>
                {idx === 0 && (
                  <kbd className="text-[9px]">↵</kbd>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={submit}
            disabled={!body.trim() || pending}
            className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
            Comment
          </button>
        </div>
      </div>
    </section>
  );
}

function CommentRow({
  comment,
  author,
  members,
  currentUserId,
  isOwn,
  onDelete,
}: {
  comment: Comment;
  author?: User;
  members: User[];
  currentUserId: string;
  isOwn: boolean;
  onDelete: () => void;
}) {
  // Render body with @mentions highlighted
  const renderBody = () => {
    if (comment.mentions.length === 0) return comment.body;
    const memberMap = new Map(members.map((m) => [m.id, m]));
    let result: React.ReactNode[] = [comment.body];
    for (const mentionId of comment.mentions) {
      const member = memberMap.get(mentionId);
      if (!member) continue;
      const tag = `@${member.name.replace(/\s+/g, "")}`;
      const newResult: React.ReactNode[] = [];
      for (const part of result) {
        if (typeof part !== "string") {
          newResult.push(part);
          continue;
        }
        const segs = part.split(tag);
        for (let i = 0; i < segs.length; i++) {
          if (i > 0) {
            const isCurrentUser = mentionId === currentUserId;
            newResult.push(
              <span
                key={`${mentionId}-${i}`}
                className={cn(
                  "font-semibold rounded px-1 -mx-0.5",
                  isCurrentUser
                    ? "bg-accent/20 text-accent"
                    : "bg-info-bg text-info"
                )}
              >
                {tag}
              </span>
            );
          }
          if (segs[i]) newResult.push(segs[i]);
        }
      }
      result = newResult;
    }
    return result;
  };

  return (
    <div className="px-3 py-2.5 group">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-5 h-5 rounded-full bg-surface-elevated border border-border-strong flex items-center justify-center text-[10px] font-mono font-bold text-accent shrink-0">
          {author?.name[0]?.toUpperCase() ?? "?"}
        </span>
        <span className="text-[13px] font-semibold">
          {author?.name ?? "Unknown"}
        </span>
        <span className="text-[11px] font-mono text-text-subtle">
          {formatRelativeTime(comment.createdAt)}
        </span>
        {isOwn && (
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto opacity-0 group-hover:opacity-100 p-1 text-text-subtle hover:text-warn-text transition-opacity"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="text-[13px] text-text whitespace-pre-wrap pl-7 leading-relaxed">
        {renderBody()}
      </div>
    </div>
  );
}
