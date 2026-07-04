import Link from "next/link";
import { redirect } from "next/navigation";
import { PrintButton } from "@/components/results/PrintButton";
import { ReviewTabs } from "@/components/results/ReviewTabs";
import { getOwnedAttempt } from "@/lib/exam/guard";
import { resultPayload } from "@/lib/exam/payload";
import { th } from "@/lib/i18n/th";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const attempt = await getOwnedAttempt(attemptId);
  if (!attempt) redirect("/");
  if (attempt.status !== "completed") redirect(`/test/${attemptId}`);

  const result = resultPayload(attempt);
  const ratio = result.composite / 36;
  const circumference = 2 * Math.PI * 56;
  const testDate = new Date(result.completedAt ?? result.startedAt).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="mx-auto max-w-3xl">
        {/* hero */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
          <p className="text-sm text-slate-500">
            {result.studentName} · {th.results.testDate} {testDate}
          </p>
          <div className="mt-4 flex justify-center">
            <div className="relative h-36 w-36">
              <svg viewBox="0 0 128 128" className="h-36 w-36 -rotate-90">
                <circle cx="64" cy="64" r="56" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - ratio)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-slate-900 tabular-nums">
                  {result.composite}
                </span>
                <span className="text-xs text-slate-400">{th.results.outOf36}</span>
              </div>
            </div>
          </div>
          <p className="mt-2 font-semibold text-slate-700">{th.results.composite}</p>
        </div>

        {/* per-section cards */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {result.sections.map((s) => (
            <div key={s.code} className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500">{s.nameEn}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900 tabular-nums">{s.scaleScore}</p>
              <p className="text-xs text-slate-400 tabular-nums">
                {th.results.raw(s.rawScore, s.questionCount)}
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{ width: `${(s.scaleScore / 36) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* breakdown */}
        <div className="mt-5 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="space-y-3">
            {result.sections.map((s) => {
              const total = s.questionCount;
              return (
                <div key={s.code}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span className="font-medium">{s.nameEn}</span>
                    <span className="tabular-nums">
                      ✅ {s.correct} · ❌ {s.incorrect} · ⬜ {s.unanswered}
                    </span>
                  </div>
                  <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
                    <div className="bg-emerald-500" style={{ width: `${(s.correct / total) * 100}%` }} />
                    <div className="bg-red-400" style={{ width: `${(s.incorrect / total) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            {th.results.correct} · {th.results.incorrect} · {th.results.unanswered}
          </p>
        </div>

        {/* answer review */}
        <div className="mt-5 no-print">
          <ReviewTabs sections={result.sections} />
        </div>

        {/* footer actions */}
        <div className="mt-6 flex justify-center gap-3 no-print">
          <Link
            href="/"
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {th.results.retake}
          </Link>
          <PrintButton />
        </div>
      </div>
    </main>
  );
}
