import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import ExcelJS from "exceljs";

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

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Roster");
  ws.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Duty", key: "duty", width: 20 },
    { header: "Location", key: "location", width: 18 },
    { header: "Officer", key: "officer", width: 18 },
    { header: "Belt Number", key: "belt", width: 16 },
    { header: "Rank", key: "rank", width: 14 },
    { header: "Shift", key: "shift", width: 12 },
    { header: "Start", key: "start", width: 10 },
    { header: "End", key: "end", width: 10 },
    { header: "Hours", key: "hours", width: 8 },
  ];

  let prevDate: string | null = null;
  let prevDuty: string | null = null;

  for (const a of assignments) {
    const dutyName = a.duty?.duty_name ?? "";
    if (prevDate !== null && (a.assignment_date !== prevDate || dutyName !== prevDuty)) {
      ws.addRow({});
    }
    ws.addRow({
      date: a.assignment_date,
      duty: dutyName,
      location: a.duty?.location ?? "",
      officer: a.officer?.name ?? "",
      belt: a.officer?.belt_number ?? "",
      rank: a.officer?.rank ?? "",
      shift: a.shift_type,
      start: a.start_time,
      end: a.end_time,
      hours: a.working_hours,
    });
    prevDate = a.assignment_date;
    prevDuty = dutyName;
  }

  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=roster.xlsx",
    },
  });
}
