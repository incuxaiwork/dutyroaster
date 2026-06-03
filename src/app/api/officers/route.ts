import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

async function hoursFor(officerId: number, since: string) {
  const result = await prisma.dutyAssignment.aggregate({
    where: { officer_id: officerId, assignment_date: { gte: since } },
    _sum: { working_hours: true },
  });
  return result._sum.working_hours ?? 0;
}

function serialize(officer: any, weekly: number, monthly: number) {
  return {
    id: officer.id,
    name: officer.name,
    belt_number: officer.belt_number,
    rank: officer.rank,
    station: officer.station,
    mobile_number: officer.mobile_number,
    gender: officer.gender,
    department_unit: officer.department_unit,
    joining_date: officer.joining_date,
    availability_status: officer.availability_status,
    is_active: officer.is_active,
    skills: officer.skills?.map((s: any) => s.skill?.name || s.name) ?? [],
    weekly_hours: Math.round(weekly * 10) / 10,
    monthly_hours: Math.round(monthly * 10) / 10,
  };
}

function weekStart() {
  const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}

function monthStart() {
  const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  const where: any = { is_active: true };
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { belt_number: { contains: search } },
    ];
  }

  const officers = await prisma.officer.findMany({
    where,
    include: { skills: { include: { skill: true } } },
    orderBy: [{ rank: "asc" }, { name: "asc" }],
  });

  const ws = weekStart();
  const ms = monthStart();
  const result: any[] = [];

  for (const o of officers) {
    const weekly = await hoursFor(o.id, ws);
    const monthly = await hoursFor(o.id, ms);
    result.push(serialize(o, weekly, monthly));
  }

  return Response.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const existing = await prisma.officer.findUnique({ where: { belt_number: body.belt_number } });
  if (existing) return Response.json({ error: "Belt number exists" }, { status: 409 });

  const officer = await prisma.officer.create({
    data: {
      name: body.name,
      belt_number: body.belt_number,
      rank: body.rank,
      station: body.station,
      mobile_number: body.mobile_number || null,
      gender: body.gender || null,
      department_unit: body.department_unit || null,
      joining_date: body.joining_date || null,
      availability_status: body.availability_status || "Available",
      is_active: true,
    },
  });

  if (body.skills?.length) {
    for (const s of body.skills) {
      const skill = await prisma.skill.upsert({ where: { name: s }, update: {}, create: { name: s } });
      await prisma.officerSkill.create({ data: { officer_id: officer.id, skill_id: skill.id } }).catch(() => {});
    }
  }

  return Response.json(serialize(officer, 0, 0));
}
