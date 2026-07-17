import { NextResponse } from "next/server";
import { prisma } from "../../../src/server/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function configured(...names) {
  return names.some((name) => Boolean(process.env[name]));
}

export async function GET() {
  const browserProjectUrl = configured("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_PROJECT_URL");
  const serverProjectUrl = configured("NEXT_PUBLIC_SUPABASE_URL", "PROJECT_URL");
  const browserKey = configured("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRole = configured("SUPABASE_SERVICE_ROLE_KEY", "SECRET_KEY");
  const databaseConfigured = configured("DATABASE_URL");
  let database = databaseConfigured ? "unreachable" : "missing";

  if (databaseConfigured) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = "ready";
    } catch (error) {
      console.error("Deployment health check could not reach PostgreSQL:", error);
    }
  }

  const checks = {
    database,
    browserAuth: browserProjectUrl && browserKey ? "ready" : "missing",
    serverAuth: serverProjectUrl && serviceRole ? "ready" : "missing",
    listingStorage: serverProjectUrl && serviceRole ? "ready" : "missing",
  };
  const ready = Object.values(checks).every((value) => value === "ready");

  return NextResponse.json(
    {
      ok: ready,
      checks,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    },
    { status: ready ? 200 : 503 },
  );
}
