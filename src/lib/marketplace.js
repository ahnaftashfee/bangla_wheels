import { priceModel } from "../data/marketplaceData";

export const idFor = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export function go(path) {
  window.location.hash = path;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

export function numberFrom(value) {
  return Number(String(value).replace(/[^\d]/g, "")) || 0;
}

export function formatBDT(amount) {
  if (!Number.isFinite(amount)) return "Tk 0";
  if (amount >= 10000000) return `Tk ${(amount / 10000000).toFixed(2)} Cr`;
  return `Tk ${(amount / 100000).toFixed(1)} Lac`;
}

export function formatDate(iso) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function calculatePriceEstimate({ make, year, mileage, fuel, condition }) {
  const base = priceModel[make] || 2600000;
  const age = Math.max(0, 2026 - Number(year || 2020));
  const ageFactor = Math.max(0.45, 1 - age * 0.055);
  const mileageFactor = Math.max(0.65, 1 - numberFrom(mileage) / 260000);
  const fuelBoost = fuel === "Hybrid" ? 1.09 : fuel === "Electric" ? 1.12 : fuel === "Diesel" ? 0.94 : 1;
  const conditionFactor = {
    Excellent: 1.08,
    Good: 1,
    Average: 0.9,
    "Needs Work": 0.78,
  }[condition || "Good"];
  const midpoint = Math.round(base * ageFactor * mileageFactor * fuelBoost * conditionFactor);

  return {
    low: Math.round(midpoint * 0.92),
    midpoint,
    high: Math.round(midpoint * 1.08),
  };
}
