import Link from "next/link";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { listAttempts, type AttemptStatus } from "@/lib/dal/attempts";
import { SECTION_ORDER } from "@/lib/exam/definition";
import { th } from "@/lib/i18n/th";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<AttemptStatus, { text: string; cls: string }> = {
  in_progress: { text: th.admin.attempts.statusInProgress, cls: "bg-amber-100 text-amber-800" },
  completed: { text: th.admin.attempts.statusFinished, cls: "bg-emerald-100 text-emerald-800" },
  abandoned: { text: th.admin.attempts.statusAbandoned, cls: "bg-slate-100 text-slate-600" },
};

export default async function AttemptsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const status = ["in_progress", "completed", "abandoned"].includes(sp.status ?? "")
    ? (sp.status as AttemptStatus)
    : undefined;
  const attempts = listAttempts(status);
  const staleCutoff = Date.now() - 24 * 60 * 60 * 1000;

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-900">{th.admin.nav.attempts}</h1>
        <a
          href="/api/admin/export.csv"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ⬇ {th.admin.attempts.exportCsv}
        </a>
      </div>

      <form method="get" className="mb-4">
        <select
          name="status"
          defaultValue={sp.status ?? ""}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
        >
          <option value="">{th.admin.questions.all}</option>
          <option value="in_progress">{th.admin.attempts.statusInProgress}</option>
          <option value="completed">{th.admin.attempts.statusFinished}</option>
          <option value="abandoned">{th.admin.attempts.statusAbandoned}</option>
        </select>
        <button className="ml-2 rounded-lg bg-slate-900 px-4 py-1.5 text-sm text-white hover:bg-slate-700">
          🔍
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 text-left">
              <th className="px-4 py-2.5 font-medium">{th.admin.attempts.colName}</th>
              <th className="px-4 py-2.5 font-medium">{th.admin.attempts.colDate}</th>
              <th className="px-4 py-2.5 font-medium">{th.admin.attempts.colStatus}</th>
              <th className="px-3 py-2.5 font-medium text-center">E</th>
              <th className="px-3 py-2.5 font-medium text-center">M</th>
              <th className="px-3 py-2.5 font-medium text-center">R</th>
              <th className="px-3 py-2.5 font-medium text-center">S</th>
              <th className="px-4 py-2.5 font-medium text-center">
                {th.admin.attempts.colComposite}
              </th>
              <th className="px-4 py-2.5 font-medium w-28">{th.admin.questions.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {attempts.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                  {th.admin.common.empty}
                </td>
              </tr>
            )}
            {attempts.map((a) => {
              const badge = STATUS_LABEL[a.status];
              const bySection = new Map(a.sections.map((s) => [s.section_code, s]));
              const stale =
                a.status === "in_progress" && Date.parse(a.started_at) < staleCutoff;
              return (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-800">{a.student_name}</td>
                  <td className="px-4 py-2 text-slate-500 text-xs">
                    {new Date(a.started_at).toLocaleString("th-TH", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                      {badge.text}
                    </span>
                    {stale && (
                      <span className="ml-1.5 text-xs text-red-500" title={th.admin.attempts.staleFlag}>
                        ⏰
                      </span>
                    )}
                  </td>
                  {SECTION_ORDER.map((code) => (
                    <td key={code} className="px-3 py-2 text-center tabular-nums">
                      {bySection.get(code)?.scale_score ?? "—"}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-center font-bold tabular-nums">
                    {a.composite_score ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/attempts/${a.id}`}
                      className="text-indigo-600 hover:underline mr-3"
                    >
                      {th.admin.attempts.view}
                    </Link>
                    <DeleteButton
                      url={`/api/admin/attempts/${a.id}`}
                      confirmText={th.admin.attempts.deleteConfirm}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
