import Link from "next/link";
import { dashboardStats, hardestQuestions, sectionAverages } from "@/lib/dal/stats";
import { listAttempts } from "@/lib/dal/attempts";
import { SECTIONS, SECTION_ORDER } from "@/lib/exam/definition";
import { th } from "@/lib/i18n/th";

export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  const stats = dashboardStats();
  const averages = new Map(sectionAverages().map((s) => [s.section_code, s.avg_scale]));
  const recent = listAttempts().slice(0, 10);
  const hardest = hardestQuestions(20);

  const cards = [
    { label: th.admin.dashboard.finished, value: stats.finishedCount },
    { label: th.admin.dashboard.avgComposite, value: stats.avgComposite ?? "—" },
    { label: th.admin.dashboard.inProgress, value: stats.inProgressCount },
    { label: th.admin.dashboard.questionCount, value: stats.activeQuestionCount },
  ];

  return (
    <main className="p-8">
      <h1 className="text-xl font-bold text-slate-900 mb-6">{th.admin.nav.dashboard}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900 tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            {th.admin.dashboard.sectionAverages}
          </h2>
          <div className="space-y-2.5">
            {SECTION_ORDER.map((code) => {
              const avg = averages.get(code) ?? null;
              return (
                <div key={code}>
                  <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                    <span>{SECTIONS[code].nameEn}</span>
                    <span className="tabular-nums">{avg ?? "—"} / 36</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-600"
                      style={{ width: `${((avg ?? 0) / 36) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            {th.admin.dashboard.recentAttempts}
          </h2>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-400">{th.admin.common.empty}</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {recent.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100 first:border-0">
                    <td className="py-1.5 text-slate-800">{a.student_name}</td>
                    <td className="py-1.5 text-slate-400 text-xs">
                      {new Date(a.started_at).toLocaleString("th-TH", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="py-1.5 text-right font-semibold tabular-nums">
                      {a.composite_score ?? "—"}
                    </td>
                    <td className="py-1.5 text-right">
                      <Link
                        href={`/admin/attempts/${a.id}`}
                        className="text-indigo-600 hover:underline text-xs"
                      >
                        {th.admin.attempts.view} →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {hardest.length > 0 && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            {th.admin.dashboard.hardestQuestions}
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 text-left">
                <th className="pb-2 font-medium">{th.admin.questions.colSection}</th>
                <th className="pb-2 font-medium">{th.admin.questions.colPosition}</th>
                <th className="pb-2 font-medium">{th.admin.questions.colStem}</th>
                <th className="pb-2 font-medium text-right">{th.admin.dashboard.correctRate}</th>
              </tr>
            </thead>
            <tbody>
              {hardest.map((q) => (
                <tr key={q.question_id} className="border-t border-slate-100">
                  <td className="py-1.5 text-slate-500">{SECTIONS[q.section_code].nameEn}</td>
                  <td className="py-1.5 tabular-nums">{q.position}</td>
                  <td className="py-1.5 text-slate-700 max-w-md truncate">
                    <Link href={`/admin/questions/${q.question_id}`} className="hover:underline">
                      {q.stem_md.slice(0, 80)}
                    </Link>
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {Math.round(q.correct_rate * 100)}% ({q.correct}/{q.answered})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
