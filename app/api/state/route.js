import { NextResponse } from "next/server";
import { applyPrototypeAction, readPrototypeState } from "../../../src/server/prototypeStore";
import { applyDatabaseAction, readDatabaseState } from "../../../src/server/databaseStore";
import { getAuthContext, requireActionPermission } from "../../../src/server/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    const auth = await getAuthContext(request);
    const state = await readDatabaseState(auth);
    return NextResponse.json(state);
  } catch (error) {
    console.error("Database read failed, using local fallback:", error);
    const state = await readPrototypeState();
    return NextResponse.json(state);
  }
}

export async function POST(request) {
  const { type, payload } = await request.json();
  const auth = await getAuthContext(request);
  const denied = requireActionPermission(auth, type);
  if (denied) return denied;

  try {
    const result = await applyDatabaseAction(type, payload, auth);
    return NextResponse.json(result);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      try {
      const result = await applyPrototypeAction(type, payload);
      return NextResponse.json(result);
      } catch {
        return NextResponse.json({ error: error.message || "Unable to update application state." }, { status: 400 });
      }
    }
    return NextResponse.json({ error: error.message || "Unable to update application state." }, { status: 400 });
  }
}
