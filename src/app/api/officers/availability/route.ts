import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { officer_id, status, start_date, end_date, reason } = await req.json();
  const officer = await prisma.officer.findUnique({ where: { id: officer_id } });
  if (!officer) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.officer.update({ where: { id: officer_id }, data: { availability_status: status } });
  await prisma.officerAvailability.create({ data: { officer_id, status, start_date, end_date, reason } });
  return Response.json({ ok: true });
}
