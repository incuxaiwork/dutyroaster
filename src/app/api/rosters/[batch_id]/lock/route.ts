import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ batch_id: string }> }) {
  const batchId = Number((await params).batch_id);
  const { actor_id } = await req.json().catch(() => ({}));
  const batch = await prisma.rosterBatch.findUnique({ where: { id: batchId } });
  if (!batch) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.rosterBatch.update({ where: { id: batchId }, data: { is_locked: true } });
  await prisma.dutyAssignment.updateMany({ where: { roster_batch_id: batchId }, data: { is_locked: true } });
  await prisma.rosterHistory.create({ data: { roster_batch_id: batchId, action: "locked", details: "Roster finalized" } });
  return Response.json({ ok: true });
}
