import { NextResponse } from "next/server";
import { prisma } from "./prisma.js";
import { getSupabaseAdmin } from "./supabaseAdmin.js";

export const roles = {
  guest: "guest",
  buyer: "buyer",
  seller: "seller",
  dealer: "dealer",
  admin: "admin",
};

const permissions = {
  toggleSave: [roles.buyer, roles.seller, roles.dealer, roles.admin],
  toggleCompare: [roles.buyer, roles.seller, roles.dealer, roles.admin],
  submitLead: [roles.buyer, roles.seller, roles.dealer, roles.admin],
  createAlert: [roles.buyer, roles.seller, roles.dealer, roles.admin],
  addInspection: [roles.buyer, roles.seller, roles.dealer, roles.admin],
  addClaim: [roles.buyer, roles.seller, roles.dealer, roles.admin],
  addListing: [roles.seller, roles.dealer, roles.admin],
  addKyc: [roles.seller, roles.dealer, roles.admin],
  deleteListing: [roles.admin],
  updateItem: [roles.admin],
  updateRole: [roles.admin],
  reset: [roles.admin],
};

function bearerToken(request) {
  const value = request.headers.get("authorization") || "";
  return value.toLowerCase().startsWith("bearer ") ? value.slice(7).trim() : "";
}

function roleFromUser(user) {
  const metadataRole = user?.app_metadata?.role || user?.user_metadata?.role;
  return Object.values(roles).includes(metadataRole) && metadataRole !== roles.guest ? metadataRole : roles.buyer;
}

function displayName(user) {
  return user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "BanglaWheel User";
}

function profileData(user, role) {
  return {
    id: `profile-${user.id}`,
    authUserId: user.id,
    name: displayName(user),
    phone: user.phone || "",
    email: user.email || "",
    role,
    language: "en",
    budgetMin: 0,
    budgetMax: 999999999,
    division: "Dhaka",
    verified: Boolean(user.email_confirmed_at || user.phone_confirmed_at),
  };
}

export async function getAuthContext(request) {
  const token = bearerToken(request);
  if (!token) return { user: null, profile: null, role: roles.guest };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { user: null, profile: null, role: roles.guest };

  const user = data.user;
  const fallbackRole = roleFromUser(user);
  const existing = await prisma.profile.findUnique({ where: { authUserId: user.id } });
  const role = existing?.role || fallbackRole;
  const nextData = { ...profileData(user, role), ...(existing?.data || {}), authUserId: user.id, role };

  const profile = await prisma.profile.upsert({
    where: { authUserId: user.id },
    create: {
      id: nextData.id,
      authUserId: user.id,
      name: nextData.name,
      phone: nextData.phone || null,
      email: nextData.email || null,
      role,
      language: nextData.language || "en",
      verified: Boolean(nextData.verified),
      data: nextData,
    },
    update: {
      name: nextData.name,
      phone: nextData.phone || null,
      email: nextData.email || null,
      role,
      language: nextData.language || "en",
      verified: Boolean(nextData.verified),
      data: nextData,
    },
  });

  return { user, profile, role: profile.role || roles.buyer };
}

export function can(role, action) {
  return permissions[action]?.includes(role) || false;
}

export function requireActionPermission(auth, action) {
  if (!auth.user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }
  if (!can(auth.role, action)) {
    return NextResponse.json({ error: "Not authorized for this action." }, { status: 403 });
  }
  return null;
}
