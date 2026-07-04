import Link from "next/link";
import { notFound } from "next/navigation";
import { PassageForm } from "@/components/admin/PassageForm";
import { getPassage, getPassageQuestions } from "@/lib/dal/questions";
import { th } from "@/lib/i18n/th";

export const dynamic = "force-dynamic";

export default async function EditPassagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const passage = getPassage(Number(id));
  if (!passage) notFound();
  const questions = getPassageQuestions(passage.id);

  return (
    <main className="p-8">
      <h1 className="text-xl font-bold text-slate-900 mb-6">
        {th.admin.questions.edit} — {passage.title}
      </h1>
      <div className="grid xl:grid-cols-[1fr_320px] gap-8">
        <PassageForm
          passageId={passage.id}
          initial={{
            section_code: passage.section_code,
            position: passage.position,
            title: passage.title,
            body_md: passage.body_md,
            kind: passage.kind,
          }}
        />
        <aside>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">
              {th.admin.passages.linkedQuestions} ({questions.length})
            </h2>
            <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {questions.map((q) => (
                <li key={q.id}>
                  <Link
                    href={`/admin/questions/${q.id}`}
                    className="block py-2 text-sm text-slate-700 hover:text-indigo-600"
                  >
                    <span className="font-bold tabular-nums mr-2">{q.position}.</span>
                    {q.stem_md.slice(0, 60)}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href={`/admin/questions/new?passageId=${passage.id}`}
              className="mt-3 block text-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
            >
              {th.admin.passages.addQuestion}
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
