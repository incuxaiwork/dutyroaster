import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

function serialize(duty: any) {
  return {
    id: duty.id,
    duty_name: duty.duty_name,
    duty_type: duty.duty_type,
    location: duty.location,
    start_date: duty.start_date,
    end_date: duty.end_date,
    start_time: duty.start_time,
    end_time: duty.end_time,
    shift_type: duty.shift_type,
    required_officers: duty.required_officers,
    required_rank: duty.required_rank,
    required_skills: (duty.required_skills || "").split(",").map((s: string) => s.trim()).filter(Boolean),
    priority_level: duty.priority_level,
    special_instructions: duty.special_instructions,
    status: duty.status,
    incharge_officer_id: duty.incharge_officer_id,
    incharge_officer_name: duty.incharge_officer?.name ?? null,
    incharge_officer_rank: duty.incharge_officer?.rank ?? null,
    incharge_officer_belt: duty.incharge_officer?.belt_number ?? null,
    created_at: duty.created_at,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const status = searchParams.get("status");

  const where: any = {};
  if (date) where.start_date = date;
  if (status) where.status = status;

  const duties = await prisma.duty.findMany({
    where,
    include: { incharge_officer: true },
    orderBy: [{ start_date: "desc" }, { start_time: "asc" }],
  });
  return Response.json(duties.map(serialize));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data: any = {
    duty_name: body.duty_name,
    duty_type: body.duty_type,
    location: body.location || null,
    start_date: body.start_date,
    end_date: body.end_date || null,
    start_time: body.start_time,
    end_time: body.end_time,
    shift_type: body.shift_type,
    required_officers: body.required_officers ?? 1,
    required_rank: body.required_rank || null,
    required_skills: Array.isArray(body.required_skills) ? body.required_skills.join(", ") : (body.required_skills || null),
    priority_level: body.priority_level || "Medium",
    special_instructions: body.special_instructions || null,
    status: body.status || "Pending Allocation",
    incharge_officer_id: body.incharge_officer_id ? Number(body.incharge_officer_id) : null,
  };

  const duty = await prisma.duty.create({
    data,
    include: { incharge_officer: true },
  });

  return Response.json(serialize(duty));
}
