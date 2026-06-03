import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const assignment = await prisma.dutyAssignment.findUnique({ where: { id } });
  if (!assignment) return Response.json({ error: "Not found" }, { status: 404 });
  if (assignment.is_locked) return Response.json({ error: "Locked" }, { status: 409 });
  await prisma.dutyAssignment.delete({ where: { id } });
  return Response.json({ ok: true });
}
