"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Persist a task input field to localStorage so the user doesn't lose
 * work on tab close, refresh, or accidental nav-away. Restored on mount.
 *
 * Usage:
 *   const [text, setText, clearDraft] = useTaskDraft(taskId, initialValue);
 *   // text auto-saves on every change
 *   // clearDraft() after successful submit so old draft doesn't haunt
 *   // the next session.
 *
 * Storage key shape: `creops-draft-task-${taskId}`. Cleared on submit
 * by the caller.
 */
export function useTaskDraft(
  taskId: string,
  initialValue: string
): [string, (v: string) => void, () => void] {
  const storageKey = `creops-draft-task-${taskId}`;
  const [text, setText] = useState(initialValue);
  const restored = useRef(false);

  // Restore draft from localStorage on mount. Prefer the draft over the
  // server's saved value if both exist (user's in-progress edits win).
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null && saved !== initialValue) {
        setText(saved);
      }
    } catch {
      // ignore — localStorage might be disabled
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save on every change. Cheap — localStorage writes are sync but
  // string-sized payloads are <1ms.
  useEffect(() => {
    if (!restored.current) return;
    try {
      // Skip persisting the initial value — only save real edits.
      if (text === initialValue) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, text);
      }
    } catch {
      // ignore
    }
  }, [text, storageKey, initialValue]);

  function clearDraft() {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }

  return [text, setText, clearDraft];
}
