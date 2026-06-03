import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findFirst();
  if (existing) return;

  const hash = await bcrypt.hash("admin", 10);
  await prisma.user.create({
    data: { name: "Admin", email: "admin@drms.local", password_hash: hash, role: "Admin" },
  });

  console.log("Seeded admin user (admin / admin)");
}

main().catch(console.error).finally(() => prisma.$disconnect());
