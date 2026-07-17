import { NextResponse } from "next/server";
import { applyPrototypeAction, readPrototypeState } from "../../../src/server/prototypeStore";
import { applyDatabaseAction, readDatabaseState } from "../../../src/server/databaseStore";
import { getAuthContext, requireActionPermission } from "../../../src/server/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function visibleFallbackState(state, auth) {
  const profileId = auth.profile?.id || null;
  const listings = auth.role === "admin"
    ? state.listings
    : state.listings.filter((listing) => listing.status === "approved" || (profileId && listing.sellerId === profileId));
  return {
    ...state,
    profile: auth.profile ? { ...(auth.profile.data || {}), ...auth.profile } : { id: "guest", name: "BanglaWheel User", phone: "", email: "", role: "guest", language: "en", budgetMin: 0, budgetMax: 999999999, division: "Dhaka", verified: false },
    listings,
    users: auth.role === "admin" ? (state.users || []) : [],
  };
}

export async function GET(request) {
  const auth = await getAuthContext(request);
  try {
    const state = await readDatabaseState(auth);
    return NextResponse.json(state);
  } catch (error) {
    console.error("Database read failed, using local fallback:", error);
    const state = await readPrototypeState();
    return NextResponse.json(visibleFallbackState(state, auth));
  }
}

export async function POST(request) {
  const { type, payload } = await request.json();
  const auth = await getAuthContext(request);
  const denied = requireActionPermission(auth, type);
  if (denied) return denied;
  const safePayload = type === "addListing"
    ? { ...payload, listing: { ...(payload?.listing || {}), sellerId: auth.profile?.id, sellerName: auth.profile?.name || payload?.listing?.sellerName } }
    : type === "addKyc" ? { ...payload, kyc: { ...(payload?.kyc || {}), sellerId: auth.profile?.id } } : payload;

  try {
    const result = await applyDatabaseAction(type, safePayload, auth);
    return NextResponse.json(result);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      try {
      const result = await applyPrototypeAction(type, safePayload);
      return NextResponse.json({ ...result, state: visibleFallbackState(result.state, auth) });
      } catch {
        return NextResponse.json({ error: error.message || "Unable to update application state." }, { status: 400 });
      }
    }
    return NextResponse.json({ error: error.message || "Unable to update application state." }, { status: 400 });
  }
}
