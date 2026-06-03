import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { assignment_id, officer_id } = await req.json();
  const assignment = await prisma.dutyAssignment.findUnique({ where: { id: assignment_id } });
  if (!assignment) return Response.json({ error: "Not found" }, { status: 404 });
  if (assignment.is_locked) return Response.json({ error: "Locked" }, { status: 409 });

  const updated = await prisma.dutyAssignment.update({
    where: { id: assignment_id },
    data: { officer_id },
    include: { officer: true, duty: true },
  });

  return Response.json({
    id: updated.id, duty_id: updated.duty_id, officer_id: updated.officer_id, roster_batch_id: updated.roster_batch_id,
    assignment_date: updated.assignment_date, start_time: updated.start_time, end_time: updated.end_time,
    shift_type: updated.shift_type, working_hours: updated.working_hours, is_locked: updated.is_locked,
    officer_name: updated.officer?.name ?? null, belt_number: updated.officer?.belt_number ?? null,
    station: updated.officer?.station ?? null, duty_name: updated.duty?.duty_name ?? null, location: updated.duty?.location ?? null,
  });
}
