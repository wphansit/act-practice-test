import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ReviewTabs } from "@/components/results/ReviewTabs";
import { getAttempt, getAttemptSections } from "@/lib/dal/attempts";
import { resultPayload } from "@/lib/exam/payload";
import { SECTIONS } from "@/lib/exam/definition";
import { th } from "@/lib/i18n/th";

export const dynamic = "force-dynamic";

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "medium" });
}

function duration(start: string | null, end: string | null): string {
  if (!start || !end) return "—";
  const minutes = Math.round((Date.parse(end) - Date.parse(start)) / 60000);
  return `${minutes} ${th.landing.minutes}`;
}

export default async function AttemptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const attempt = getAttempt(id);
  if (!attempt) notFound();
  const sections = getAttemptSections(id);
  const completed = attempt.status === "completed";
  const result = completed ? resultPayload(attempt) : null;

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{attempt.student_name}</h1>
          <p className="text-sm text-slate-500">
            {th.admin.attempts.startedAt} {fmt(attempt.started_at)} ·{" "}
            {completed
              ? `${th.admin.attempts.statusFinished} ${fmt(attempt.completed_at)}`
              : th.admin.attempts.statusInProgress}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {completed && (
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-700 tabular-nums">
                {attempt.composite_score}
              </p>
              <p className="text-xs text-slate-400">Composite</p>
            </div>
          )}
          <DeleteButton
            url={`/api/admin/attempts/${id}`}
            confirmText={th.admin.attempts.deleteConfirm}
            redirectTo="/admin/attempts"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          />
        </div>
      </div>

      {/* per-section timing + scores */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 text-left">
              <th className="px-4 py-2.5 font-medium">{th.admin.questions.colSection}</th>
              <th className="px-4 py-2.5 font-medium">{th.admin.attempts.colStatus}</th>
              <th className="px-4 py-2.5 font-medium">{th.admin.attempts.startedAt}</th>
              <th className="px-4 py-2.5 font-medium">{th.admin.attempts.submittedAt}</th>
              <th className="px-4 py-2.5 font-medium">{th.admin.attempts.timing}</th>
              <th className="px-4 py-2.5 font-medium text-right">Raw</th>
              <th className="px-4 py-2.5 font-medium text-right">Scale</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => (
              <tr key={s.section_code} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-800">
                  {SECTIONS[s.section_code].nameEn}
                </td>
                <td className="px-4 py-2 text-slate-500">{s.status}</td>
                <td className="px-4 py-2 text-slate-500 text-xs">{fmt(s.started_at)}</td>
                <td className="px-4 py-2 text-slate-500 text-xs">{fmt(s.submitted_at)}</td>
                <td className="px-4 py-2 text-slate-500">{duration(s.started_at, s.submitted_at)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{s.raw_score ?? "—"}</td>
                <td className="px-4 py-2 text-right font-semibold tabular-nums">
                  {s.scale_score ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {result && <ReviewTabs sections={result.sections} />}
    </main>
  );
}
