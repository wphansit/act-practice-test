import { SECTIONS, SECTION_ORDER } from "@/lib/exam/definition";
import { th } from "@/lib/i18n/th";
import { StartForm } from "@/components/StartForm";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-slate-900">{th.app.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{th.app.subtitle}</p>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">
            {th.landing.overviewTitle}
          </h2>
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left px-3 py-2 font-medium">{th.landing.colSection}</th>
                <th className="text-right px-3 py-2 font-medium">{th.landing.colQuestions}</th>
                <th className="text-right px-3 py-2 font-medium">{th.landing.colTime}</th>
              </tr>
            </thead>
            <tbody>
              {SECTION_ORDER.map((code) => {
                const s = SECTIONS[code];
                return (
                  <tr key={code} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-800">
                      {s.nameEn}
                      <span className="text-slate-400 text-xs ml-1.5">{s.nameTh}</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {s.questionCount} {th.landing.questionsUnit}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {s.durationSeconds / 60} {th.landing.minutes}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t border-slate-200 bg-slate-50">
                <td colSpan={3} className="px-3 py-2 text-center text-slate-600 font-medium">
                  {th.landing.totalRow}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <StartForm />

        <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⚠️ {th.landing.timerWarning}
        </p>
      </div>
    </main>
  );
}
