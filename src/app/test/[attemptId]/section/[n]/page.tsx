import { redirect } from "next/navigation";
import { SectionRunner } from "@/components/runner/SectionRunner";
import { getAttemptSection } from "@/lib/dal/attempts";
import { sectionByPosition } from "@/lib/exam/definition";
import { getOwnedAttempt } from "@/lib/exam/guard";
import { sectionRunnerPayload } from "@/lib/exam/payload";

export const dynamic = "force-dynamic";

/**
 * Server shell for the exam screen: validates state (post deadline
 * enforcement) and hands the sanitized payload to the client island.
 * Refresh lands back here and picks up the same server-anchored deadline.
 */
export default async function SectionPage({
  params,
}: {
  params: Promise<{ attemptId: string; n: string }>;
}) {
  const { attemptId, n } = await params;
  const def = sectionByPosition(Number(n));
  if (!def) redirect(`/test/${attemptId}`);

  const attempt = await getOwnedAttempt(attemptId);
  if (!attempt) redirect("/");
  if (attempt.status !== "in_progress") redirect(`/test/${attemptId}`);

  const row = getAttemptSection(attemptId, def.code);
  if (!row || row.status !== "in_progress" || !row.deadline_at) {
    redirect(`/test/${attemptId}`);
  }

  return <SectionRunner payload={sectionRunnerPayload(attemptId, row)} />;
}
