import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const { status } = await req.json();
  const duty = await prisma.duty.findUnique({ where: { id } });
  if (!duty) return Response.json({ error: "Not found" }, { status: 404 });
  const updated = await prisma.duty.update({ where: { id }, data: { status } });
  return Response.json({
    id: updated.id, duty_name: updated.duty_name, duty_type: updated.duty_type, location: updated.location,
    start_date: updated.start_date, end_date: updated.end_date, start_time: updated.start_time, end_time: updated.end_time,
    shift_type: updated.shift_type, required_officers: updated.required_officers, required_rank: updated.required_rank,
    required_skills: (updated.required_skills || "").split(",").map((s: string) => s.trim()).filter(Boolean),
    priority_level: updated.priority_level, special_instructions: updated.special_instructions, status: updated.status,
    incharge_officer_id: updated.incharge_officer_id, incharge_officer_name: null, incharge_officer_rank: null, incharge_officer_belt: null,
    created_at: updated.created_at,
  });
}
