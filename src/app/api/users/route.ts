import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function GET() {
  const users = await prisma.user.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] });
  return Response.json(users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, station_scope: u.station_scope, is_active: u.is_active })));
}

export async function POST(req: NextRequest) {
  const { name, email, password, role, station_scope } = await req.json();
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password_hash: hash, role, station_scope, is_active: true },
  });
  return Response.json({ id: user.id, name: user.name, email: user.email, role: user.role, station_scope: user.station_scope, is_active: user.is_active });
}
