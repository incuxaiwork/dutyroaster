import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const logs = await prisma.auditLog.findMany({ orderBy: { created_at: "desc" }, take: 200 });
  return Response.json(logs.map((l) => ({
    id: l.id, action: l.action, entity_type: l.entity_type, details: l.details, created_at: l.created_at,
  })));
}
