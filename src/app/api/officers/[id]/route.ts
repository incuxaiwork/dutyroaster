import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const officer = await prisma.officer.findUnique({ where: { id } });
  if (!officer) return Response.json({ error: "Not found" }, { status: 404 });
  await prisma.officer.update({ where: { id }, data: { is_active: false } });
  return Response.json({ ok: true });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const body = await req.json();
  const officer = await prisma.officer.findUnique({ where: { id } });
  if (!officer) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.officer.update({
    where: { id },
    data: {
      name: body.name, belt_number: body.belt_number, rank: body.rank, station: body.station,
      mobile_number: body.mobile_number ?? null, gender: body.gender ?? null,
      department_unit: body.department_unit ?? null, joining_date: body.joining_date ?? null,
      availability_status: body.availability_status,
    },
  });

  if (body.skills) {
    await prisma.officerSkill.deleteMany({ where: { officer_id: id } });
    for (const s of body.skills) {
      const skill = await prisma.skill.upsert({ where: { name: s }, update: {}, create: { name: s } });
      await prisma.officerSkill.create({ data: { officer_id: id, skill_id: skill.id } }).catch(() => {});
    }
  }

  return Response.json({ ok: true });
}
