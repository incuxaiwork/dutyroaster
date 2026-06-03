import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  const where: any = {};
  if (date) where.assignment_date = date;

  const assignments = await prisma.dutyAssignment.findMany({
    where,
    include: { duty: true, officer: true },
    orderBy: [{ assignment_date: "desc" }, { start_time: "asc" }],
  });

  const lines: string[] = [];
  lines.push("Police Duty Roster");
  lines.push("");
  lines.push("Date        | Shift      | Duty                 | Officer                    | Location");
  lines.push("-".repeat(95));

  let prevDate: string | null = null;
  let prevDuty: string | null = null;

  for (const a of assignments) {
    const dutyName = a.duty?.duty_name ?? "";
    if (prevDate !== null && (a.assignment_date !== prevDate || dutyName !== prevDuty)) {
      lines.push("-".repeat(95));
    }
    const officerName = a.officer?.name ?? "";
    const belt = a.officer?.belt_number ?? "";
    const loc = a.duty?.location ?? "";
    lines.push(
      `${String(a.assignment_date).padEnd(12)} | ${String(a.shift_type).padEnd(11)} | ${String(dutyName).padEnd(22)} | ${String(`${officerName} (${belt})`).padEnd(26)} | ${loc}`
    );
    prevDate = a.assignment_date;
    prevDuty = dutyName;
  }

  const text = lines.join("\n");
  return new Response(text, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": "attachment; filename=roster.txt",
    },
  });
}
