import { redirect } from "next/navigation";
import { getAttemptSections } from "@/lib/dal/attempts";
import { getOwnedAttempt } from "@/lib/exam/guard";

export const dynamic = "force-dynamic";

/**
 * Dispatcher — the single re-entry point. Never renders UI: reads attempt
 * state (after deadline enforcement) and redirects to the canonical page.
 * Handles refresh, browser back, and reopening finished attempts.
 */
export default async function AttemptDispatcher({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const attempt = await getOwnedAttempt(attemptId);
  if (!attempt) redirect("/");
  if (attempt.status === "completed") redirect(`/results/${attemptId}`);
  if (attempt.status === "abandoned") redirect("/");

  const next = getAttemptSections(attemptId).find((s) => s.status !== "submitted");
  if (!next) redirect(`/results/${attemptId}`); // safety net; enforce finalizes normally
  if (next.status === "in_progress") redirect(`/test/${attemptId}/section/${next.position}`);
  redirect(`/test/${attemptId}/instructions/${next.position}`);
}
