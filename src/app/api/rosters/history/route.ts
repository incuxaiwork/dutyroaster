import { prisma } from "@/lib/db";

export async function GET() {
  const batches = await prisma.rosterBatch.findMany({
    orderBy: { created_at: "desc" },
    take: 100,
  });

  const batchIds = batches.map((b) => b.id);
  const assignments = await prisma.dutyAssignment.findMany({
    where: { roster_batch_id: { in: batchIds } },
    select: { roster_batch_id: true, shift_type: true },
    distinct: ["roster_batch_id", "shift_type"],
  });

  const shiftsByBatch: Record<number, Set<string>> = {};
  for (const a of assignments) {
    if (!shiftsByBatch[a.roster_batch_id!]) shiftsByBatch[a.roster_batch_id!] = new Set();
    shiftsByBatch[a.roster_batch_id!].add(a.shift_type);
  }

  return Response.json(batches.map((b) => ({
    id: b.id,
    date: b.roster_date,
    station: b.station,
    shift_type: b.shift_type || [...(shiftsByBatch[b.id] || [])].sort().join(", ") || null,
    fairness_score: b.fairness_score,
    is_locked: b.is_locked,
    created_at: b.created_at,
  })));
}
