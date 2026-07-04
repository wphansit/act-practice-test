"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface AnswerState {
  selectedIndex: number | null;
  isFlagged: boolean;
}

export type SaveStatus = "saved" | "saving" | "error";

const RETRY_DELAYS_MS = [500, 2000, 5000];
const DEBOUNCE_MS = 400;

/**
 * Optimistic autosave queue: per-question 400ms debounce, one in-flight
 * request per question (newer values supersede), 3 retries with backoff,
 * then a persistent-error state that keeps retrying every 8s. flush() fires
 * everything immediately (used before submit and on tab hide).
 */
export function useAutosave(attemptId: string, onSectionClosed: () => void) {
  const pending = useRef(new Map<number, AnswerState>());
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const inflight = useRef(new Set<number>());
  const retries = useRef(new Map<number, number>());
  const [status, setStatus] = useState<SaveStatus>("saved");
  const closedRef = useRef(false);

  const send = useCallback(
    async (questionId: number) => {
      if (closedRef.current) return;
      const value = pending.current.get(questionId);
      if (value === undefined || inflight.current.has(questionId)) return;
      inflight.current.add(questionId);
      pending.current.delete(questionId);
      setStatus("saving");
      try {
        const res = await fetch(`/api/attempts/${attemptId}/answers`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            questionId,
            selectedIndex: value.selectedIndex,
            isFlagged: value.isFlagged,
          }),
        });
        inflight.current.delete(questionId);
        if (res.status === 409) {
          closedRef.current = true;
          onSectionClosed();
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        retries.current.delete(questionId);
        if (pending.current.has(questionId)) {
          void send(questionId); // a newer value arrived while in flight
        } else if (pending.current.size === 0 && inflight.current.size === 0) {
          setStatus("saved");
        }
      } catch {
        inflight.current.delete(questionId);
        if (!pending.current.has(questionId)) pending.current.set(questionId, value);
        const attempt = (retries.current.get(questionId) ?? 0) + 1;
        retries.current.set(questionId, attempt);
        if (attempt <= RETRY_DELAYS_MS.length) {
          setTimeout(() => void send(questionId), RETRY_DELAYS_MS[attempt - 1]);
        } else {
          setStatus("error");
          setTimeout(() => {
            retries.current.set(questionId, 0);
            void send(questionId);
          }, 8000);
        }
      }
    },
    [attemptId, onSectionClosed],
  );

  const save = useCallback(
    (questionId: number, value: AnswerState) => {
      pending.current.set(questionId, value);
      const existing = timers.current.get(questionId);
      if (existing) clearTimeout(existing);
      timers.current.set(
        questionId,
        setTimeout(() => void send(questionId), DEBOUNCE_MS),
      );
    },
    [send],
  );

  const flush = useCallback(async () => {
    for (const questionId of [...pending.current.keys()]) {
      const timer = timers.current.get(questionId);
      if (timer) clearTimeout(timer);
      void send(questionId);
    }
    // Best-effort settle: wait up to 2s for the queue to drain.
    for (let i = 0; i < 20 && (pending.current.size > 0 || inflight.current.size > 0); i++) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }, [send]);

  // Force-flush when the tab is hidden (laptop closed, tab switched away).
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [flush]);

  return { save, flush, status };
}
