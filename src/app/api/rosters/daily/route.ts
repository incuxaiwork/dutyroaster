import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return Response.json([]);

  const assignments = await prisma.dutyAssignment.findMany({
    where: { assignment_date: date },
    include: { officer: true, duty: true },
    orderBy: { start_time: "asc" },
  });

  return Response.json(assignments.map((a) => ({
    id: a.id, duty_id: a.duty_id, officer_id: a.officer_id, roster_batch_id: a.roster_batch_id,
    assignment_date: a.assignment_date, start_time: a.start_time, end_time: a.end_time,
    shift_type: a.shift_type, working_hours: a.working_hours, is_locked: a.is_locked,
    officer_name: a.officer?.name ?? null, belt_number: a.officer?.belt_number ?? null,
    station: a.officer?.station ?? null, duty_name: a.duty?.duty_name ?? null, location: a.duty?.location ?? null,
  })));
}
