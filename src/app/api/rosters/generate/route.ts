import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

function dutyHours(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let s = sh * 60 + sm, e = eh * 60 + em;
  if (e <= s) e += 1440;
  return Math.round(((e - s) / 60) * 100) / 100;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const [ash, asm] = aStart.split(":").map(Number);
  const [aeh, aem] = aEnd.split(":").map(Number);
  const [bsh, bsm] = bStart.split(":").map(Number);
  const [beh, bem] = bEnd.split(":").map(Number);
  let a1 = ash * 60 + asm, a2 = aeh * 60 + aem;
  let b1 = bsh * 60 + bsm, b2 = beh * 60 + bem;
  if (a2 <= a1) a2 += 1440;
  if (b2 <= b1) b2 += 1440;
  return a1 < b2 && b1 < a2;
}

function assignmentView(a: any) {
  return {
    id: a.id, duty_id: a.duty_id, officer_id: a.officer_id, roster_batch_id: a.roster_batch_id,
    assignment_date: a.assignment_date, start_time: a.start_time, end_time: a.end_time,
    shift_type: a.shift_type, working_hours: a.working_hours, is_locked: a.is_locked,
    officer_name: a.officer?.name ?? null, belt_number: a.officer?.belt_number ?? null,
    station: a.officer?.station ?? null, duty_name: a.duty?.duty_name ?? null, location: a.duty?.location ?? null,
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, station, shift, duty_ids, generated_by } = body;

  const duties = await prisma.duty.findMany({
    where: {
      start_date: date,
      status: { not: "Cancelled" },
      ...(station ? { location: { contains: station } } : {}),
      ...(shift ? { shift_type: shift } : {}),
      ...(duty_ids?.length ? { id: { in: duty_ids } } : {}),
    },
    orderBy: [{ priority_level: "asc" }, { start_time: "asc" }],
  });

  const batch = await prisma.rosterBatch.create({
    data: { roster_date: date, station: station || null, shift_type: shift || null, generated_by: generated_by || null },
  });

  const weekStart = (() => {
    const d = new Date(date + "T00:00:00");
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().slice(0, 10);
  })();

  const weeklyAgg = await prisma.dutyAssignment.groupBy({
    by: ["officer_id"],
    where: { assignment_date: { gte: weekStart, lte: date } },
    _sum: { working_hours: true },
  });
  const weeklyHours: Record<number, number> = {};
  for (const r of weeklyAgg) weeklyHours[r.officer_id] = r._sum.working_hours ?? 0;

  const unavailRecords = await prisma.officerAvailability.findMany({
    where: { start_date: { lte: date }, end_date: { gte: date }, status: { not: "Available" } },
  });
  const unavailableIds = new Set(unavailRecords.map((r: any) => r.officer_id));

  const existingAssignments = await prisma.dutyAssignment.findMany({
    where: { assignment_date: date },
    include: { officer: true, duty: true },
  });

  let assignedCount = 0;
  const unfilled: any[] = [];
  const created: any[] = [];

  for (const duty of duties) {
    const requiredSkills = new Set((duty.required_skills || "").split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean));

    const allOfficers = await prisma.officer.findMany({
      where: {
        is_active: true,
        availability_status: "Available",
        id: { notIn: [...unavailableIds, 0] },
        ...(station ? { station } : {}),
        ...(duty.required_rank ? { rank: duty.required_rank } : {}),
      },
      include: { skills: { include: { skill: true } } },
    });

    const eligible = [];
    for (const officer of allOfficers) {
      const officerSkillNames = new Set(officer.skills.map((s: any) => s.skill?.name?.toLowerCase() ?? ""));
      if (requiredSkills.size > 0 && ![...requiredSkills].every((s) => officerSkillNames.has(s))) continue;

      const officerExisting = existingAssignments.filter((a) => a.officer_id === officer.id);
      if (officerExisting.some((a) => a.shift_type === duty.shift_type)) continue;
      if (officerExisting.some((a) => overlaps(a.start_time, a.end_time, duty.start_time, duty.end_time))) continue;
      eligible.push(officer);
    }

    eligible.sort((a, b) => (weeklyHours[a.id] ?? 0) - (weeklyHours[b.id] ?? 0));

    const selected = eligible.slice(0, duty.required_officers);
    for (const officer of selected) {
      const wh = dutyHours(duty.start_time, duty.end_time);
      const assignment = await prisma.dutyAssignment.create({
        data: {
          duty_id: duty.id,
          officer_id: officer.id,
          roster_batch_id: batch.id,
          assignment_date: date,
          start_time: duty.start_time,
          end_time: duty.end_time,
          shift_type: duty.shift_type,
          working_hours: wh,
        },
        include: { officer: true, duty: true },
      });
      created.push(assignment);
      weeklyHours[officer.id] = (weeklyHours[officer.id] ?? 0) + wh;
      assignedCount++;
    }

    const dutyStatus = selected.length >= duty.required_officers ? "Allocated" : "Pending Allocation";
    await prisma.duty.update({ where: { id: duty.id }, data: { status: dutyStatus } });

    if (selected.length < duty.required_officers) {
      unfilled.push({ duty_id: duty.id, duty_name: duty.duty_name, missing: duty.required_officers - selected.length });
    }
  }

  const hours = Object.values(weeklyHours);
  const fairness = hours.length > 1
    ? Math.max(0, Math.round((100 - (Math.max(...hours) - Math.min(...hours))) * 100) / 100)
    : 100;

  await prisma.rosterBatch.update({ where: { id: batch.id }, data: { fairness_score: fairness } });

  return Response.json({
    batch_id: batch.id,
    fairness_score: fairness,
    assigned_count: assignedCount,
    unfilled,
    assignments: created.map(assignmentView),
  });
}
