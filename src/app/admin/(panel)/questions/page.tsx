import Link from "next/link";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { listPassages, listQuestions, listTopics } from "@/lib/dal/questions";
import { choiceLetter, isSectionCode, SECTIONS, SECTION_ORDER, type SectionCode } from "@/lib/exam/definition";
import { th } from "@/lib/i18n/th";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const section =
    sp.section && isSectionCode(sp.section) ? (sp.section as SectionCode) : undefined;
  const passageId = sp.passageId ? Number(sp.passageId) : undefined;
  const topic = sp.topic || undefined;
  const search = sp.q || undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const { rows, total } = listQuestions({ section, passageId, topic, search, page, pageSize: PAGE_SIZE });
  const passages = listPassages(section);
  const topics = listTopics(section);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const query = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ section: sp.section, passageId: sp.passageId, topic: sp.topic, q: sp.q, ...overrides })) {
      if (v !== undefined && v !== "") params.set(k, String(v));
    }
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-900">{th.admin.nav.questions}</h1>
        <Link
          href="/admin/questions/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {th.admin.questions.add}
        </Link>
      </div>

      {/* filters — plain GET form, no client JS needed */}
      <form method="get" className="flex flex-wrap items-end gap-3 mb-4">
        <label className="text-xs text-slate-500">
          {th.admin.questions.filterSection}
          <select name="section" defaultValue={sp.section ?? ""} className="mt-1 block rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800">
            <option value="">{th.admin.questions.all}</option>
            {SECTION_ORDER.map((code) => (
              <option key={code} value={code}>{SECTIONS[code].nameEn}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-500">
          {th.admin.questions.filterPassage}
          <select name="passageId" defaultValue={sp.passageId ?? ""} className="mt-1 block rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 max-w-52">
            <option value="">{th.admin.questions.all}</option>
            {passages.map((p) => (
              <option key={p.id} value={p.id}>{SECTIONS[p.section_code].nameEn}: {p.title}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-500">
          {th.admin.questions.filterTopic}
          <select name="topic" defaultValue={sp.topic ?? ""} className="mt-1 block rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 max-w-44">
            <option value="">{th.admin.questions.all}</option>
            {topics.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <input
          type="text"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder={th.admin.questions.search}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm w-52"
        />
        <button className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm text-white hover:bg-slate-700">
          🔍
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 text-left">
              <th className="px-4 py-2.5 font-medium w-16">{th.admin.questions.colPosition}</th>
              <th className="px-4 py-2.5 font-medium w-28">{th.admin.questions.colSection}</th>
              <th className="px-4 py-2.5 font-medium w-48">{th.admin.questions.colPassage}</th>
              <th className="px-4 py-2.5 font-medium">{th.admin.questions.colStem}</th>
              <th className="px-4 py-2.5 font-medium w-14">{th.admin.questions.colAnswer}</th>
              <th className="px-4 py-2.5 font-medium w-32">{th.admin.questions.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">{th.admin.common.empty}</td></tr>
            )}
            {rows.map((q) => (
              <tr key={q.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 tabular-nums">{q.position}</td>
                <td className="px-4 py-2 text-slate-500">{SECTIONS[q.section_code].nameEn}</td>
                <td className="px-4 py-2 text-slate-500 truncate max-w-48">{q.passage_title ?? "—"}</td>
                <td className="px-4 py-2 text-slate-800 truncate max-w-md">{q.stem_md.slice(0, 80)}</td>
                <td className="px-4 py-2 font-bold">{choiceLetter(q.position, q.correct_index)}</td>
                <td className="px-4 py-2">
                  <Link href={`/admin/questions/${q.id}`} className="text-indigo-600 hover:underline mr-3">
                    {th.admin.questions.edit}
                  </Link>
                  <DeleteButton
                    url={`/api/admin/questions/${q.id}`}
                    confirmText={th.admin.questions.deleteConfirm}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          {page > 1 && (
            <Link href={query({ page: page - 1 })} className="rounded border border-slate-300 bg-white px-3 py-1 hover:bg-slate-50">←</Link>
          )}
          <span className="text-slate-500 tabular-nums">{page} / {totalPages} ({total})</span>
          {page < totalPages && (
            <Link href={query({ page: page + 1 })} className="rounded border border-slate-300 bg-white px-3 py-1 hover:bg-slate-50">→</Link>
          )}
        </div>
      )}
    </main>
  );
}
