import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const user = await prisma.user.findFirst({
    where: { name: username, is_active: true },
  });
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }
  return Response.json({
    token: `demo-token-${user.id}`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      station_scope: user.station_scope,
    },
  });
}
