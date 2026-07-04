import Link from "next/link";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { listPassages } from "@/lib/dal/questions";
import { isSectionCode, SECTIONS, type SectionCode } from "@/lib/exam/definition";
import { th } from "@/lib/i18n/th";

export const dynamic = "force-dynamic";

export default async function PassagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const section =
    sp.section && isSectionCode(sp.section) ? (sp.section as SectionCode) : undefined;
  const passages = listPassages(section);

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-900">{th.admin.nav.passages}</h1>
        <Link
          href="/admin/passages/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {th.admin.passages.add}
        </Link>
      </div>

      <form method="get" className="mb-4">
        <select
          name="section"
          defaultValue={sp.section ?? ""}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
        >
          <option value="">{th.admin.questions.all}</option>
          {(["english", "reading", "science"] as const).map((code) => (
            <option key={code} value={code}>
              {SECTIONS[code].nameEn}
            </option>
          ))}
        </select>
        <button className="ml-2 rounded-lg bg-slate-900 px-4 py-1.5 text-sm text-white hover:bg-slate-700">
          🔍
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 text-left">
              <th className="px-4 py-2.5 font-medium">{th.admin.passages.colTitle}</th>
              <th className="px-4 py-2.5 font-medium w-28">{th.admin.passages.colSection}</th>
              <th className="px-4 py-2.5 font-medium w-36">{th.admin.passages.kind}</th>
              <th className="px-4 py-2.5 font-medium w-32 text-right">{th.admin.passages.colLinked}</th>
              <th className="px-4 py-2.5 font-medium w-32">{th.admin.questions.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {passages.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  {th.admin.common.empty}
                </td>
              </tr>
            )}
            {passages.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-800">{p.title}</td>
                <td className="px-4 py-2 text-slate-500">{SECTIONS[p.section_code].nameEn}</td>
                <td className="px-4 py-2 text-slate-400 text-xs">{p.kind ?? "—"}</td>
                <td className="px-4 py-2 text-right tabular-nums">{p.question_count}</td>
                <td className="px-4 py-2">
                  <Link
                    href={`/admin/passages/${p.id}`}
                    className="text-indigo-600 hover:underline mr-3"
                  >
                    {th.admin.questions.edit}
                  </Link>
                  <DeleteButton
                    url={`/api/admin/passages/${p.id}`}
                    confirmText={th.admin.questions.deleteConfirm}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
