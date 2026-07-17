import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { seed } from "./platformSeed.js";

const dataDir = path.join(process.cwd(), ".data");
const dataFile = path.join(dataDir, "prototype-state.json");

const mutableCollections = new Set([
  "listings",
  "kycRequests",
  "inspections",
  "auctions",
  "warranties",
  "enquiries",
  "alerts",
  "notifications",
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function idFor(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
}

function slugFor(listing) {
  return `${listing.year}-${listing.make}-${listing.model}-${listing.city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function initialState() {
  return {
    ...clone(seed),
    saved: [],
    compare: [],
  };
}

function normalizeState(state) {
  const base = initialState();
  return {
    ...base,
    ...state,
    profile: { ...base.profile, ...state.profile },
    saved: Array.isArray(state.saved) ? state.saved : base.saved,
    compare: Array.isArray(state.compare) ? state.compare : base.compare,
    listings: Array.isArray(state.listings) ? state.listings : base.listings,
    enquiries: Array.isArray(state.enquiries) ? state.enquiries : base.enquiries,
    alerts: Array.isArray(state.alerts) ? state.alerts : base.alerts,
    kycRequests: Array.isArray(state.kycRequests) ? state.kycRequests : base.kycRequests,
    inspections: Array.isArray(state.inspections) ? state.inspections : base.inspections,
    notifications: Array.isArray(state.notifications) ? state.notifications : base.notifications,
  };
}

async function ensureDataDir() {
  await mkdir(dataDir, { recursive: true });
}

export async function readPrototypeState() {
  await ensureDataDir();
  try {
    const raw = await readFile(dataFile, "utf8");
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const state = initialState();
    await writePrototypeState(state);
    return state;
  }
}

export async function writePrototypeState(state) {
  await ensureDataDir();
  const normalized = normalizeState(state);
  await writeFile(dataFile, JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
}

export async function resetPrototypeState() {
  return writePrototypeState(initialState());
}

export function applyActionToState(state, type, payload = {}) {
  if (type === "reset") {
    return { state: initialState(), message: "Demo data restored." };
  }

  let next = state;
  let message;

  switch (type) {
    case "toggleSave": {
      const { id } = payload;
      const exists = next.saved.includes(id);
      next = { ...next, saved: exists ? next.saved.filter((item) => item !== id) : [...next.saved, id] };
      message = exists ? "Removed from saved cars." : "Saved to your account.";
      break;
    }
    case "toggleCompare": {
      const { id } = payload;
      const exists = next.compare.includes(id);
      next = { ...next, compare: exists ? next.compare.filter((item) => item !== id) : [...next.compare, id].slice(-3) };
      message = exists ? "Removed from comparison." : "Added to comparison.";
      break;
    }
    case "submitLead": {
      const lead = { id: idFor("lead"), status: "new", createdAt: new Date().toISOString(), ...payload.lead };
      next = {
        ...next,
        enquiries: [lead, ...next.enquiries],
        listings: next.listings.map((listing) => listing.id === lead.listingId ? { ...listing, views: Number(listing.views || 0) + 1 } : listing),
      };
      message = "Enquiry created and seller phone revealed.";
      break;
    }
    case "createAlert": {
      const alert = { id: idFor("alert"), active: true, createdAt: new Date().toISOString(), ...payload.alert };
      next = { ...next, alerts: [alert, ...next.alerts] };
      message = "Saved search alert created.";
      break;
    }
    case "addListing": {
      const listing = {
        ...payload.listing,
        id: idFor("bw"),
        slug: slugFor(payload.listing),
        status: "pending",
        postedAt: new Date().toISOString(),
        views: 0,
      };
      next = { ...next, listings: [listing, ...next.listings] };
      message = "Listing submitted to admin moderation.";
      break;
    }
    case "deleteListing": {
      const { id } = payload;
      next = {
        ...next,
        listings: next.listings.filter((listing) => listing.id !== id),
        saved: next.saved.filter((listingId) => listingId !== id),
        compare: next.compare.filter((listingId) => listingId !== id),
        enquiries: next.enquiries.filter((lead) => lead.listingId !== id),
        inspections: next.inspections.filter((inspection) => inspection.listingId !== id),
        auctions: next.auctions.filter((auction) => auction.listingId !== id),
        warranties: next.warranties.filter((warranty) => warranty.listingId !== id),
      };
      message = "Listing permanently deleted.";
      break;
    }
    case "addKyc": {
      const kyc = { id: idFor("kyc"), status: "pending", createdAt: new Date().toISOString(), ...payload.kyc };
      next = { ...next, kycRequests: [kyc, ...next.kycRequests] };
      message = "KYC submitted for admin review.";
      break;
    }
    case "addInspection": {
      const inspection = { id: idFor("inspection"), status: "Requested", createdAt: new Date().toISOString(), ...payload.inspection };
      next = { ...next, inspections: [inspection, ...next.inspections] };
      message = "Inspection request added to admin queue.";
      break;
    }
    case "addBid": {
      const { auctionId, amount, maxAutoBid = "" } = payload;
      next = {
        ...next,
        auctions: next.auctions.map((auction) => auction.id === auctionId ? {
          ...auction,
          currentBid: amount,
          bidHistory: [{ bidder: "You_**00", amount, at: "just now", maxAutoBid }, ...auction.bidHistory],
          watchers: Number(auction.watchers || 0) + 1,
        } : auction),
        notifications: [{ id: idFor("note"), title: "Bid placed", body: `Your bid ${amount} BDT was placed.`, channel: "In-app", status: "unread" }, ...next.notifications],
      };
      message = "Bid placed.";
      break;
    }
    case "addClaim": {
      const claim = { id: idFor("claim"), status: "Submitted", createdAt: new Date().toISOString(), ...payload.claim };
      next = {
        ...next,
        warranties: next.warranties.map((warranty) => warranty.listingId === claim.listingId ? { ...warranty, claims: [claim, ...warranty.claims] } : warranty),
      };
      message = "Warranty claim submitted.";
      break;
    }
    case "updateProfile": {
      const patchValue = payload.patchValue || {};
      next = { ...next, profile: { ...next.profile, ...patchValue } };
      message = "Profile settings saved.";
      break;
    }
    case "updateItem": {
      const { collection, id, patchValue } = payload;
      if (!mutableCollections.has(collection)) {
        throw new Error(`Unsupported collection: ${collection}`);
      }
      if (collection === "listings" && patchValue.certified === true) {
        const listing = next.listings.find((item) => item.id === id);
        const inspectionScore = Number(listing?.inspectionReport?.overall || 0);
        if (inspectionScore < 70) {
          throw new Error("A published inspection score of 70 or higher is required before certification.");
        }
      }
      next = {
        ...next,
        [collection]: next[collection].map((item) => item.id === id ? { ...item, ...patchValue } : item),
      };
      if (collection === "listings" && patchValue.status === "approved") message = "Listing approved and published.";
      else if (collection === "listings" && patchValue.status === "pending") message = "Listing returned to pending review.";
      else if (collection === "listings" && patchValue.status === "rejected") message = "Listing rejected and removed from the marketplace.";
      else if (collection === "listings" && patchValue.certified) message = "Listing certified successfully.";
      else message = "Admin queue updated.";
      break;
    }
    default:
      throw new Error(`Unsupported action: ${type}`);
  }

  return { state: next, message };
}

export async function applyPrototypeAction(type, payload = {}) {
  if (type === "reset") {
    return { state: await resetPrototypeState(), message: "Demo data restored." };
  }

  const state = await readPrototypeState();
  const result = applyActionToState(state, type, payload);
  return { ...result, state: await writePrototypeState(result.state) };
}
