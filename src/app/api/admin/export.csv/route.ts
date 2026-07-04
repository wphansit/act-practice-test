import { NextResponse } from "next/server";
import { listAttempts } from "@/lib/dal/attempts";
import { SECTION_ORDER } from "@/lib/exam/definition";

function csvField(value: string | number | null): string {
  if (value === null) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

/** CSV export of all attempts. UTF-8 BOM so Thai names open correctly in Excel. */
export async function GET() {
  const header = [
    "attempt_id",
    "student_name",
    "started_at",
    "completed_at",
    "status",
    ...SECTION_ORDER.flatMap((code) => [`${code}_raw`, `${code}_scale`]),
    "composite",
  ];
  const lines = [header.join(",")];
  for (const a of listAttempts()) {
    const bySection = new Map(a.sections.map((s) => [s.section_code, s]));
    lines.push(
      [
        csvField(a.id),
        csvField(a.student_name),
        csvField(a.started_at),
        csvField(a.completed_at),
        csvField(a.status),
        ...SECTION_ORDER.flatMap((code) => {
          const s = bySection.get(code);
          return [csvField(s?.raw_score ?? null), csvField(s?.scale_score ?? null)];
        }),
        csvField(a.composite_score),
      ].join(","),
    );
  }
  const csv = "\uFEFF" + lines.join("\n"); // BOM for Excel
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="act-results.csv"',
    },
  });
}
