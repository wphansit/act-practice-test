"use client";

import { useMemo, useState } from "react";
import { choiceLetter } from "@/lib/exam/definition";
import type { ResultSectionPayload } from "@/lib/exam/payload";
import { th } from "@/lib/i18n/th";
import { renderMd, renderMdInline } from "@/lib/md";

/** Answer review: tabs per section, "wrong only" filter (default ON). */
export function ReviewTabs({ sections }: { sections: ResultSectionPayload[] }) {
  const [tab, setTab] = useState(0);
  const [wrongOnly, setWrongOnly] = useState(true);

  const section = sections[tab];
  const items = useMemo(
    () =>
      section.review.filter(
        (q) => !wrongOnly || q.selectedIndex === null || q.selectedIndex !== q.correctIndex,
      ),
    [section, wrongOnly],
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="border-b border-slate-200 px-4 pt-3 flex items-end justify-between flex-wrap gap-2">
        <div className="flex gap-1" role="tablist" aria-label={th.results.reviewTitle}>
          {sections.map((s, i) => (
            <button
              key={s.code}
              role="tab"
              aria-selected={i === tab}
              onClick={() => setTab(i)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                i === tab
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {s.nameEn}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={wrongOnly}
            onChange={(e) => setWrongOnly(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
          />
          {th.results.onlyWrong}
        </label>
      </div>

      <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
        {items.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-emerald-600">
            🎉 {th.results.onlyWrong}: 0
          </p>
        )}
        {items.map((q) => {
          const wrong = q.selectedIndex !== null && q.selectedIndex !== q.correctIndex;
          const blank = q.selectedIndex === null;
          const passage = section.passages.find((p) => p.id === q.passageId);
          return (
            <div key={q.id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white tabular-nums ${
                    blank ? "bg-slate-400" : wrong ? "bg-red-500" : "bg-emerald-500"
                  }`}
                >
                  {q.position}
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className="act-serif act-content text-[15px] text-slate-900"
                    dangerouslySetInnerHTML={{ __html: renderMdInline(q.stemMd) }}
                  />
                  <div className="mt-2.5 space-y-1.5">
                    {q.choices.map((choice, i) => {
                      const isCorrect = i === q.correctIndex;
                      const isChosen = i === q.selectedIndex;
                      return (
                        <div
                          key={i}
                          className={`flex items-start gap-2 rounded-md px-2.5 py-1.5 text-sm ${
                            isCorrect
                              ? "bg-emerald-50 border border-emerald-300"
                              : isChosen
                                ? "bg-red-50 border border-red-300"
                                : "border border-transparent"
                          }`}
                        >
                          <span className="font-bold text-xs mt-0.5 w-5 shrink-0">
                            {choiceLetter(q.position, i)}.
                          </span>
                          <span
                            className="act-serif text-[14px] flex-1"
                            dangerouslySetInnerHTML={{ __html: renderMdInline(choice) }}
                          />
                          {isCorrect && (
                            <span className="text-xs font-semibold text-emerald-700 shrink-0">
                              {th.results.answerKey}
                            </span>
                          )}
                          {isChosen && !isCorrect && (
                            <span className="text-xs font-semibold text-red-600 shrink-0">
                              {th.results.yourAnswer}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {blank && (
                      <p className="text-xs text-slate-400 pl-2.5">— {th.results.noAnswer} —</p>
                    )}
                  </div>
                  <details className="mt-2 group">
                    <summary className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-800 select-none">
                      💡 {th.results.showExplanation}
                    </summary>
                    <div
                      className="mt-1.5 act-content rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700"
                      dangerouslySetInnerHTML={{ __html: renderMd(q.explanationMd) }}
                    />
                  </details>
                  {passage && (
                    <details className="mt-1.5">
                      <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-700 select-none">
                        📄 {th.runner.viewPassage}: {passage.title}
                      </summary>
                      <div
                        className="mt-1.5 act-serif act-content act-passage max-h-72 overflow-y-auto rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-[14px] text-slate-700"
                        dangerouslySetInnerHTML={{ __html: renderMd(passage.bodyMd) }}
                      />
                    </details>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
