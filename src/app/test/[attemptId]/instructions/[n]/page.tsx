import { redirect } from "next/navigation";
import { StartSectionButton } from "@/components/runner/StartSectionButton";
import { getAttemptSections } from "@/lib/dal/attempts";
import { SECTIONS, SECTION_ORDER, sectionByPosition } from "@/lib/exam/definition";
import { DIRECTIONS } from "@/lib/exam/directions";
import { getOwnedAttempt } from "@/lib/exam/guard";
import { th } from "@/lib/i18n/th";

export const dynamic = "force-dynamic";

/** Untimed interstitial before section n. The clock starts on the button. */
export default async function InstructionsPage({
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

  // This page is only valid when section n is exactly the next thing to do.
  const sections = getAttemptSections(attemptId);
  const target = sections.find((s) => s.position === def.position)!;
  if (target.status === "in_progress") redirect(`/test/${attemptId}/section/${def.position}`);
  if (target.status === "submitted") redirect(`/test/${attemptId}`);
  if (sections.some((s) => s.position < def.position && s.status !== "submitted")) {
    redirect(`/test/${attemptId}`);
  }

  const minutes = def.durationSeconds / 60;
  const isBreak = def.position === 3; // the real ACT break comes after Math

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {isBreak && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            ☕ {th.instructions.breakBanner}
          </div>
        )}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          {/* progress dots */}
          <ol className="flex items-center justify-center gap-3 mb-6" aria-label="progress">
            {SECTION_ORDER.map((code) => {
              const s = SECTIONS[code];
              const done = sections.find((x) => x.position === s.position)?.status === "submitted";
              const current = s.position === def.position;
              return (
                <li key={code} className="flex items-center gap-1.5 text-xs">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold ${
                      done
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : current
                          ? "border-indigo-600 text-indigo-700"
                          : "border-slate-300 text-slate-400"
                    }`}
                  >
                    {done ? "✓" : s.position}
                  </span>
                  <span className={current ? "text-slate-800 font-medium" : "text-slate-400"}>
                    {s.nameTh}
                  </span>
                </li>
              );
            })}
          </ol>

          <p className="text-sm text-slate-500 text-center">
            {th.instructions.partOf(def.position)}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 text-center">{def.nameEn}</h1>
          <p className="mt-2 text-center text-slate-600 tabular-nums">
            {th.instructions.stats(def.questionCount, minutes)}
          </p>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-xs font-bold tracking-widest text-slate-500 mb-2">
              {th.instructions.directionsTitle}
            </h2>
            <p className="act-serif text-slate-800">{DIRECTIONS[def.code]}</p>
          </div>

          <StartSectionButton
            attemptId={attemptId}
            code={def.code}
            position={def.position}
            label={th.instructions.start(minutes)}
          />
        </div>
      </div>
    </main>
  );
}
