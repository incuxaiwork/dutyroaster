import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

function serialize(duty: any) {
  return {
    id: duty.id, duty_name: duty.duty_name, duty_type: duty.duty_type, location: duty.location,
    start_date: duty.start_date, end_date: duty.end_date, start_time: duty.start_time, end_time: duty.end_time,
    shift_type: duty.shift_type, required_officers: duty.required_officers, required_rank: duty.required_rank,
    required_skills: (duty.required_skills || "").split(",").map((s: string) => s.trim()).filter(Boolean),
    priority_level: duty.priority_level, special_instructions: duty.special_instructions, status: duty.status,
    incharge_officer_id: duty.incharge_officer_id,
    incharge_officer_name: duty.incharge_officer?.name ?? null,
    incharge_officer_rank: duty.incharge_officer?.rank ?? null,
    incharge_officer_belt: duty.incharge_officer?.belt_number ?? null,
    created_at: duty.created_at,
  };
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const body = await req.json();

  const duty = await prisma.duty.findUnique({ where: { id }, include: { incharge_officer: true } });
  if (!duty) return Response.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.duty.update({
    where: { id },
    data: {
      duty_name: body.duty_name, duty_type: body.duty_type, location: body.location || null,
      start_date: body.start_date, end_date: body.end_date || null,
      start_time: body.start_time, end_time: body.end_time,
      shift_type: body.shift_type, required_officers: body.required_officers ?? 1,
      required_rank: body.required_rank || null,
      required_skills: Array.isArray(body.required_skills) ? body.required_skills.join(", ") : (body.required_skills || null),
      priority_level: body.priority_level || "Medium", special_instructions: body.special_instructions || null,
      status: body.status || "Pending Allocation",
      incharge_officer_id: body.incharge_officer_id ? Number(body.incharge_officer_id) : null,
    },
    include: { incharge_officer: true },
  });

  return Response.json(serialize(updated));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const duty = await prisma.duty.findUnique({ where: { id } });
  if (!duty) return Response.json({ error: "Not found" }, { status: 404 });
  await prisma.duty.update({ where: { id }, data: { status: "Cancelled" } });
  return Response.json({ ok: true });
}
