import { PassageForm } from "@/components/admin/PassageForm";
import { th } from "@/lib/i18n/th";

export default function NewPassagePage() {
  return (
    <main className="p-8">
      <h1 className="text-xl font-bold text-slate-900 mb-6">{th.admin.passages.add}</h1>
      <PassageForm />
    </main>
  );
}
