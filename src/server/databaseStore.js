import { prisma } from "./prisma.js";
import { applyActionToState, readPrototypeState as readFileState } from "./prototypeStore.js";

const appStateId = "singleton";
const defaultProfileId = "user-founder";
const guestProfile = {
  id: "guest",
  name: "BanglaWheel User",
  phone: "",
  email: "",
  role: "guest",
  language: "en",
  budgetMin: 0,
  budgetMax: 999999999,
  division: "Dhaka",
  verified: false,
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toDate(value) {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function nullableDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function iso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function fallbackId(prefix, item, index) {
  return item.id || `${prefix}-${index + 1}`;
}

function listingRecordData(listing) {
  return {
    id: listing.id,
    slug: listing.slug,
    title: listing.title || `${listing.year || ""} ${listing.make || ""} ${listing.model || ""}`.trim() || listing.id,
    make: listing.make || "",
    model: listing.model || "",
    year: Number(listing.year) || new Date().getFullYear(),
    price: Number(listing.price) || 0,
    city: listing.city || listing.division || "",
    area: listing.area || null,
    mileage: Number(listing.mileage) || 0,
    fuel: listing.fuel || "",
    transmission: listing.transmission || "",
    body: listing.body || "",
    sellerName: listing.sellerName || "",
    sellerPhone: listing.phone || listing.sellerPhone || "",
    sellerType: listing.sellerType || "",
    status: listing.status || "pending",
    verifiedSeller: Boolean(listing.verifiedSeller),
    certified: Boolean(listing.certified),
    featured: Boolean(listing.featured),
    premium: Boolean(listing.premium),
    data: listing,
    postedAt: toDate(listing.postedAt),
  };
}

function listingFromRecord(record) {
  return {
    ...record.data,
    id: record.id,
    slug: record.slug,
    title: record.title,
    make: record.make,
    model: record.model,
    year: record.year,
    price: record.price,
    city: record.city,
    area: record.area || "",
    mileage: record.mileage,
    fuel: record.fuel,
    transmission: record.transmission,
    body: record.body,
    sellerName: record.sellerName,
    sellerType: record.sellerType,
    phone: record.sellerPhone,
    status: record.status,
    verifiedSeller: record.verifiedSeller,
    certified: record.certified,
    featured: record.featured,
    premium: record.premium,
    postedAt: record.postedAt.toISOString(),
    media: record.media.sort((a, b) => a.position - b.position).map((item) => item.url),
  };
}

async function replaceListingMedia(tx, listingId, media = []) {
  await tx.listingMedia.deleteMany({ where: { listingId } });
  if (!media.length) return;
  await tx.listingMedia.createMany({
    data: media.map((url, position) => ({ listingId, url, position })),
  });
}

async function upsertListingWithTx(tx, listing) {
  const data = listingRecordData(listing);
  await tx.listing.upsert({
    where: { id: listing.id },
    create: data,
    update: data,
  });
  await replaceListingMedia(tx, listing.id, Array.isArray(listing.media) ? listing.media : []);
}

async function readListings() {
  const listings = await prisma.listing.findMany({
    include: { media: true },
    orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
  });
  return listings.map(listingFromRecord);
}

function profileRecord(profile = {}) {
  return {
    id: profile.id || defaultProfileId,
    authUserId: profile.authUserId || null,
    name: profile.name || "BanglaWheel User",
    phone: profile.phone || null,
    email: profile.email || null,
    role: profile.role || null,
    language: profile.language || "en",
    verified: Boolean(profile.verified),
    data: profile,
  };
}

function profileFromRecord(profile) {
  return profile?.data ? {
    ...profile.data,
    id: profile.id,
    authUserId: profile.authUserId,
    name: profile.name,
    phone: profile.phone || "",
    email: profile.email || "",
    role: profile.role || profile.data.role || "buyer",
    language: profile.language || profile.data.language || "en",
    verified: profile.verified,
  } : {};
}

function dealerRecord(item, index) {
  return {
    id: fallbackId("dealer", item, index),
    slug: item.slug || fallbackId("dealer", item, index),
    name: item.name || fallbackId("dealer", item, index),
    owner: item.owner || null,
    city: item.city || "",
    area: item.area || null,
    phone: item.phone || null,
    rating: item.rating == null ? null : Number(item.rating),
    inventory: Number(item.inventory) || 0,
    verified: Boolean(item.verified),
    plan: item.plan || null,
    data: item,
  };
}

function garageRecord(item, index) {
  return {
    id: fallbackId("garage", item, index),
    name: item.name || fallbackId("garage", item, index),
    city: item.city || "",
    area: item.area || null,
    phone: item.phone || null,
    rating: item.rating == null ? null : Number(item.rating),
    inspections: Number(item.inspections) || 0,
    data: item,
  };
}

function auctionRecord(item, index) {
  return {
    id: fallbackId("auction", item, index),
    listingId: item.listingId || "",
    status: item.status || "draft",
    currentBid: Number(item.currentBid) || 0,
    reservePrice: Number(item.reservePrice) || 0,
    endsAt: nullableDate(item.endsAt),
    data: item,
  };
}

function warrantyRecord(item, index) {
  const { claims: _claims, ...data } = item;
  return {
    id: fallbackId("warranty", item, index),
    listingId: item.listingId || "",
    status: item.status || "active",
    deposit: Number(item.deposit) || 0,
    escrowStatus: item.escrowStatus || null,
    period: item.period || null,
    data: { ...data, claims: [] },
  };
}

function claimRecord(item, warrantyId, listingId, index) {
  return {
    id: fallbackId("claim", item, index),
    warrantyId,
    listingId: item.listingId || listingId || "",
    status: item.status || "Submitted",
    issue: item.issue || null,
    data: item,
    createdAt: toDate(item.createdAt),
  };
}

function financePartnerRecord(item, index) {
  return {
    id: item.id || `${String(item.bank || "finance").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index + 1}`,
    bank: item.bank || "",
    product: item.product || "",
    type: item.type || null,
    maxLoan: Number(item.maxLoan) || 0,
    tenure: Number(item.tenure) || 0,
    rate: item.rate == null ? null : Number(item.rate),
    data: item,
  };
}

function articleRecord(item, index) {
  return {
    id: fallbackId("article", item, index),
    slug: item.slug || fallbackId("article", item, index),
    seo: item.seo || null,
    title: item.title || {},
    body: item.body || {},
    data: item,
  };
}

function enquiryRecord(item, index) {
  return {
    id: fallbackId("lead", item, index),
    listingId: item.listingId || "",
    listingTitle: item.listingTitle || null,
    sellerName: item.sellerName || null,
    sellerPhone: item.sellerPhone || null,
    buyerName: item.buyerName || null,
    buyerPhone: item.buyerPhone || null,
    status: item.status || "new",
    message: item.message || null,
    data: item,
    createdAt: toDate(item.createdAt),
  };
}

function alertRecord(item, index) {
  return {
    id: fallbackId("alert", item, index),
    name: item.name || "Saved car search",
    active: item.active !== false,
    matches: Number(item.matches) || 0,
    filters: item.filters || null,
    data: item,
    createdAt: toDate(item.createdAt),
  };
}

function kycRecord(item, index) {
  return {
    id: fallbackId("kyc", item, index),
    sellerId: item.sellerId || null,
    name: item.name || "Seller",
    type: item.type || null,
    status: item.status || "pending",
    data: item,
    createdAt: toDate(item.createdAt),
  };
}

function inspectionRecord(item, index) {
  return {
    id: fallbackId("inspection", item, index),
    listingId: item.listingId || "",
    garageId: item.garageId || null,
    name: item.name || null,
    phone: item.phone || null,
    preferredDate: nullableDate(item.preferredDate),
    status: item.status || "Requested",
    data: item,
    createdAt: toDate(item.createdAt),
  };
}

function notificationRecord(item, index) {
  return {
    id: fallbackId("note", item, index),
    title: item.title || "Notification",
    body: item.body || null,
    channel: item.channel || null,
    status: item.status || "unread",
    data: item,
    createdAt: toDate(item.createdAt),
  };
}

async function replaceCollection(tx, model, items, mapper) {
  await tx[model].deleteMany();
  if (!items.length) return;
  await tx[model].createMany({ data: items.map(mapper) });
}

async function writeFullState(state) {
  const profileId = state.profile?.id || defaultProfileId;

  await prisma.$transaction(async (tx) => {
    await tx.compareSelection.deleteMany();
    await tx.savedListing.deleteMany();
    await tx.warrantyClaim.deleteMany();
    await tx.warranty.deleteMany();
    await tx.auction.deleteMany();
    await tx.notification.deleteMany();
    await tx.inspectionRequest.deleteMany();
    await tx.kycRequest.deleteMany();
    await tx.searchAlert.deleteMany();
    await tx.enquiry.deleteMany();
    await tx.article.deleteMany();
    await tx.financePartner.deleteMany();
    await tx.garage.deleteMany();
    await tx.dealer.deleteMany();
    await tx.listingMedia.deleteMany();
    await tx.listing.deleteMany();

    await tx.profile.upsert({
      where: { id: profileId },
      create: profileRecord(state.profile),
      update: profileRecord(state.profile),
    });

    for (const listing of state.listings || []) {
      await upsertListingWithTx(tx, listing);
    }

    await replaceCollection(tx, "dealer", state.dealers || [], dealerRecord);
    await replaceCollection(tx, "garage", state.garages || [], garageRecord);
    await replaceCollection(tx, "auction", state.auctions || [], auctionRecord);
    await replaceCollection(tx, "financePartner", state.financePartners || [], financePartnerRecord);
    await replaceCollection(tx, "article", state.articles || [], articleRecord);
    await replaceCollection(tx, "enquiry", state.enquiries || [], enquiryRecord);
    await replaceCollection(tx, "searchAlert", state.alerts || [], alertRecord);
    await replaceCollection(tx, "kycRequest", state.kycRequests || [], kycRecord);
    await replaceCollection(tx, "inspectionRequest", state.inspections || [], inspectionRecord);
    await replaceCollection(tx, "notification", state.notifications || [], notificationRecord);

    for (const [index, warranty] of (state.warranties || []).entries()) {
      const saved = await tx.warranty.create({ data: warrantyRecord(warranty, index) });
      const claims = Array.isArray(warranty.claims) ? warranty.claims : [];
      if (claims.length) {
        await tx.warrantyClaim.createMany({
          data: claims.map((claim, claimIndex) => claimRecord(claim, saved.id, saved.listingId, claimIndex)),
        });
      }
    }

    const savedRows = (state.saved || []).map((listingId) => ({ profileId, listingId }));
    if (savedRows.length) await tx.savedListing.createMany({ data: savedRows, skipDuplicates: true });

    const compareRows = (state.compare || []).map((listingId, position) => ({ profileId, listingId, position }));
    if (compareRows.length) await tx.compareSelection.createMany({ data: compareRows, skipDuplicates: true });

    await tx.appState.upsert({
      where: { id: appStateId },
      create: { id: appStateId, data: { migratedToTables: true } },
      update: { data: { migratedToTables: true } },
    });
  }, { maxWait: 10000, timeout: 30000 });
}

async function readTableState(auth = {}) {
  const profileWhere = auth.profile?.id ? { id: auth.profile.id } : undefined;
  const profileId = auth.profile?.id || null;
  const [
    profile,
    listings,
    dealers,
    garages,
    auctions,
    warranties,
    financePartners,
    articles,
    enquiries,
    alerts,
    kycRequests,
    inspections,
    notifications,
    saved,
    compare,
    users,
  ] = await Promise.all([
    profileWhere ? prisma.profile.findUnique({ where: profileWhere }) : Promise.resolve(null),
    readListings(),
    prisma.dealer.findMany({ orderBy: { name: "asc" } }),
    prisma.garage.findMany({ orderBy: { name: "asc" } }),
    prisma.auction.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.warranty.findMany({ include: { claims: { orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "asc" } }),
    prisma.financePartner.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.article.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.enquiry.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.searchAlert.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.kycRequest.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.inspectionRequest.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.notification.findMany({ orderBy: { createdAt: "desc" } }),
    profileId ? prisma.savedListing.findMany({ where: { profileId }, orderBy: { createdAt: "asc" } }) : Promise.resolve([]),
    profileId ? prisma.compareSelection.findMany({ where: { profileId }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] }) : Promise.resolve([]),
    auth.role === "admin" ? prisma.profile.findMany({ orderBy: [{ role: "asc" }, { createdAt: "desc" }] }) : Promise.resolve([]),
  ]);

  const visibleListings = auth.role === "admin" ? listings : listings.filter((listing) => listing.status === "approved" || (profileId && listing.sellerId === profileId));

  return {
    profile: profile ? profileFromRecord(profile) : guestProfile,
    listings: visibleListings,
    dealers: dealers.map((item) => item.data),
    garages: garages.map((item) => item.data),
    auctions: auctions.map((item) => ({ ...item.data, endsAt: iso(item.endsAt) })),
    warranties: warranties.map((item) => ({
      ...item.data,
      id: item.id,
      listingId: item.listingId,
      status: item.status,
      deposit: item.deposit,
      escrowStatus: item.escrowStatus,
      period: item.period,
      claims: item.claims.map((claim) => ({ ...claim.data, id: claim.id, status: claim.status, listingId: claim.listingId, createdAt: iso(claim.createdAt) })),
    })),
    financePartners: financePartners.map((item) => item.data),
    articles: articles.map((item) => item.data),
    enquiries: enquiries.map((item) => ({ ...item.data, id: item.id, status: item.status, createdAt: iso(item.createdAt) })),
    alerts: alerts.map((item) => ({ ...item.data, id: item.id, active: item.active, createdAt: iso(item.createdAt) })),
    kycRequests: kycRequests.map((item) => ({ ...item.data, id: item.id, status: item.status, createdAt: iso(item.createdAt) })),
    inspections: inspections.map((item) => ({ ...item.data, id: item.id, status: item.status, preferredDate: item.data?.preferredDate || iso(item.preferredDate), createdAt: iso(item.createdAt) })),
    notifications: notifications.map((item) => ({ ...item.data, id: item.id, status: item.status, createdAt: item.data?.createdAt || iso(item.createdAt) })),
    saved: saved.map((item) => item.listingId),
    compare: compare.map((item) => item.listingId),
    users: users.map((item) => ({
      id: item.id,
      authUserId: item.authUserId,
      name: item.name,
      email: item.email,
      phone: item.phone,
      role: item.role || "buyer",
      verified: item.verified,
      createdAt: iso(item.createdAt),
    })),
  };
}

async function ensureDatabaseState(auth = {}) {
  const listingCount = await prisma.listing.count();
  const profileCount = await prisma.profile.count();
  const appState = await prisma.appState.findUnique({ where: { id: appStateId } });

  if (listingCount === 0 || profileCount === 0) {
    const fileState = await readFileState();
    const bridgeState = appState?.data && Object.keys(appState.data).length > 1 ? appState.data : {};
    const seedState = {
      ...fileState,
      ...bridgeState,
      listings: Array.isArray(bridgeState.listings) && bridgeState.listings.length ? bridgeState.listings : fileState.listings,
      saved: Array.isArray(bridgeState.saved) && bridgeState.saved.length ? bridgeState.saved : fileState.saved,
      compare: Array.isArray(bridgeState.compare) && bridgeState.compare.length ? bridgeState.compare : fileState.compare,
    };
    await writeFullState(seedState);
  }

  return readTableState(auth);
}

export async function readDatabaseState(auth = {}) {
  return clone(await ensureDatabaseState(auth));
}

export async function writeDatabaseState(state) {
  await writeFullState(state);
  return readDatabaseState();
}

export async function resetDatabaseState() {
  const state = await readFileState();
  await writeFullState(state);
  return readDatabaseState();
}

export async function applyDatabaseAction(type, payload = {}, auth = {}) {
  if (type === "reset") {
    return { state: await resetDatabaseState(), message: "Demo data restored." };
  }

  if (type === "updateRole") {
    const allowedRoles = new Set(["buyer", "seller", "dealer", "admin"]);
    const nextRole = String(payload.role || "").toLowerCase();
    if (!allowedRoles.has(nextRole)) throw new Error("Unsupported role.");

    const profile = await prisma.profile.findUnique({ where: { id: payload.profileId } });
    if (!profile) throw new Error("User profile not found.");

    const data = { ...(profile.data || {}), role: nextRole };
    await prisma.profile.update({
      where: { id: profile.id },
      data: { role: nextRole, data },
    });

    return { state: await readDatabaseState(auth), message: `${profile.email || profile.name} is now ${nextRole}.` };
  }

  if (type === "deleteListing") {
    const listingId = payload.id;
    if (!listingId) throw new Error("Listing id is required.");

    await prisma.$transaction(async (tx) => {
      const warranties = await tx.warranty.findMany({ where: { listingId }, select: { id: true } });
      const warrantyIds = warranties.map((warranty) => warranty.id);
      if (warrantyIds.length) await tx.warrantyClaim.deleteMany({ where: { warrantyId: { in: warrantyIds } } });
      await tx.warrantyClaim.deleteMany({ where: { listingId } });
      await tx.warranty.deleteMany({ where: { listingId } });
      await tx.auction.deleteMany({ where: { listingId } });
      await tx.inspectionRequest.deleteMany({ where: { listingId } });
      await tx.enquiry.deleteMany({ where: { listingId } });
      await tx.savedListing.deleteMany({ where: { listingId } });
      await tx.compareSelection.deleteMany({ where: { listingId } });
      await tx.listing.delete({ where: { id: listingId } });
    });

    return { state: await readDatabaseState(auth), message: "Listing permanently deleted." };
  }

  const current = await readDatabaseState(auth);
  const profileId = auth.profile?.id || current.profile?.id || defaultProfileId;
  const result = applyActionToState(current, type, payload);

  if (type === "toggleSave") {
    const exists = await prisma.savedListing.findUnique({ where: { profileId_listingId: { profileId, listingId: payload.id } } });
    if (exists) await prisma.savedListing.delete({ where: { profileId_listingId: { profileId, listingId: payload.id } } });
    else await prisma.savedListing.create({ data: { profileId, listingId: payload.id } });
    return { ...result, state: await readDatabaseState(auth) };
  }

  if (type === "toggleCompare") {
    const exists = await prisma.compareSelection.findUnique({ where: { profileId_listingId: { profileId, listingId: payload.id } } });
    if (exists) {
      await prisma.compareSelection.delete({ where: { profileId_listingId: { profileId, listingId: payload.id } } });
    } else {
      const currentCompare = await prisma.compareSelection.findMany({ where: { profileId }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
      if (currentCompare.length >= 3) await prisma.compareSelection.delete({ where: { id: currentCompare[0].id } });
      await prisma.compareSelection.create({ data: { profileId, listingId: payload.id, position: currentCompare.length } });
    }
    return { ...result, state: await readDatabaseState(auth) };
  }

  await writeDatabaseState(result.state);
  return { ...result, state: await readDatabaseState(auth) };
}
