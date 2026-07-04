import { QuestionForm } from "@/components/admin/QuestionForm";
import { listPassages, listTopics } from "@/lib/dal/questions";
import { th } from "@/lib/i18n/th";

export const dynamic = "force-dynamic";

export default async function NewQuestionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const passages = listPassages().map((p) => ({
    id: p.id,
    section_code: p.section_code,
    title: p.title,
  }));
  const preselect = sp.passageId ? passages.find((p) => p.id === Number(sp.passageId)) : undefined;

  return (
    <main className="p-8">
      <h1 className="text-xl font-bold text-slate-900 mb-6">{th.admin.questions.add}</h1>
      <QuestionForm
        passages={passages}
        topics={listTopics()}
        initial={
          preselect
            ? {
                section_code: preselect.section_code,
                passage_id: preselect.id,
                position: 1,
                stem_md: "",
                choices: ["", "", "", ""],
                correct_index: 0,
                explanation_md: "",
                difficulty: "medium",
                topic: "",
              }
            : undefined
        }
      />
    </main>
  );
}
