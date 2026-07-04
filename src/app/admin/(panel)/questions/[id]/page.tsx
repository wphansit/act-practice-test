import { notFound } from "next/navigation";
import { QuestionForm } from "@/components/admin/QuestionForm";
import { getQuestion, listPassages, listTopics } from "@/lib/dal/questions";
import { th } from "@/lib/i18n/th";

export const dynamic = "force-dynamic";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const question = getQuestion(Number(id));
  if (!question) notFound();

  const passages = listPassages().map((p) => ({
    id: p.id,
    section_code: p.section_code,
    title: p.title,
  }));

  return (
    <main className="p-8">
      <h1 className="text-xl font-bold text-slate-900 mb-1">
        {th.admin.questions.edit} — {question.section_code} #{question.position}
      </h1>
      {question.is_active !== 1 && (
        <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">
          ⚠ {th.admin.questions.inactive}
        </p>
      )}
      <div className="mt-5">
        <QuestionForm
          questionId={question.id}
          passages={passages}
          topics={listTopics()}
          initial={{
            section_code: question.section_code,
            passage_id: question.passage_id,
            position: question.position,
            stem_md: question.stem_md,
            choices: JSON.parse(question.choices_json) as string[],
            correct_index: question.correct_index,
            explanation_md: question.explanation_md,
            difficulty: question.difficulty,
            topic: question.topic,
          }}
        />
      </div>
    </main>
  );
}
