import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  return Response.json([{ status: "ok" }]);
}
