import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Bell, Filter, Plus, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { ListingCard } from "../components/ListingCard";
import { Badge, Button, SelectField, TextInput } from "../components/ui";
import {
  bodies,
  budgetBands,
  cities,
  fuels,
  makes,
  sellerTypes,
  transmissions,
} from "../data/marketplaceData";
import { go, idFor } from "../lib/marketplace";

export function BrowsePage({ route, listings, savedIds, compareIds, onSave, onCompare, onContact, onCreateAlert }) {
  const [filters, setFilters] = useState(() => ({
    query: route.query.get("q") || "",
    city: route.query.get("city") || "All Cities",
    make: route.query.get("make") || "All Makes",
    body: route.query.get("body") || "Any Body",
    fuel: route.query.get("fuel") || "Any Fuel",
    transmission: route.query.get("transmission") || "Any Transmission",
    sellerType: route.query.get("sellerType") || "Any Seller",
    minYear: route.query.get("minYear") || "Any Year",
    mileageMax: route.query.get("mileageMax") || "Any Mileage",
    budget: "Any Budget",
    verifiedOnly: route.query.get("verified") === "true",
    inspectedOnly: route.query.get("inspected") === "true",
    certifiedOnly: route.query.get("certified") === "true",
  }));
  const [sort, setSort] = useState("featured");

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const resetFilters = () => setFilters({
    query: "",
    city: "All Cities",
    make: "All Makes",
    budget: "Any Budget",
    fuel: "Any Fuel",
    transmission: "Any Transmission",
    body: "Any Body",
    sellerType: "Any Seller",
    minYear: "Any Year",
    mileageMax: "Any Mileage",
    verifiedOnly: false,
    inspectedOnly: false,
    certifiedOnly: false,
  });

  const filtered = useMemo(() => {
    const selectedBudget = budgetBands.find((item) => item.label === filters.budget) || budgetBands[0];
    const result = listings.filter((listing) => {
      const searchable = `${listing.title} ${listing.make} ${listing.model} ${listing.city} ${listing.area} ${listing.body} ${listing.fuel} ${listing.sellerName}`.toLowerCase();
      const query = filters.query.trim().toLowerCase();
      return (
        (!query || searchable.includes(query)) &&
        (filters.city === "All Cities" || listing.city === filters.city) &&
        (filters.make === "All Makes" || listing.make === filters.make) &&
        listing.price >= selectedBudget.min &&
        listing.price <= selectedBudget.max &&
        (filters.fuel === "Any Fuel" || listing.fuel === filters.fuel) &&
        (filters.transmission === "Any Transmission" || listing.transmission === filters.transmission) &&
        (filters.body === "Any Body" || listing.body === filters.body) &&
        (filters.sellerType === "Any Seller" || listing.sellerType === filters.sellerType) &&
        (filters.minYear === "Any Year" || listing.year >= Number(filters.minYear)) &&
        (filters.mileageMax === "Any Mileage" || listing.mileage <= Number(filters.mileageMax)) &&
        (!filters.verifiedOnly || listing.verified) &&
        (!filters.inspectedOnly || listing.inspected) &&
        (!filters.certifiedOnly || listing.certified)
      );
    });

    if (sort === "low") return [...result].sort((a, b) => a.price - b.price);
    if (sort === "high") return [...result].sort((a, b) => b.price - a.price);
    if (sort === "newest") return [...result].sort((a, b) => b.year - a.year);
    if (sort === "mileage") return [...result].sort((a, b) => a.mileage - b.mileage);
    return [...result].sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.certified) - Number(a.certified));
  }, [filters, listings, sort]);

  const createAlert = () => {
    onCreateAlert({
      id: idFor("alert"),
      name: filters.query || `${filters.make !== "All Makes" ? filters.make : "Any make"} in ${filters.city}`,
      filters,
      matches: filtered.length,
      active: true,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge variant="blue"><SlidersHorizontal className="h-3.5 w-3.5" /> Smart search</Badge>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Used cars for sale in Bangladesh</h1>
          <p className="mt-2 max-w-2xl font-medium text-slate-600">Filter, save, compare, create alerts, and generate seller leads from one working marketplace screen.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={createAlert}><Bell className="h-4 w-4" /> Create alert</Button>
          <Button variant="secondary" onClick={resetFilters}><RefreshCw className="h-4 w-4" /> Reset</Button>
          <Button onClick={() => go("/sell")}><Plus className="h-4 w-4" /> Post ad</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="h-fit rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-black"><Filter className="h-5 w-5 text-blue-700" /> Filters</h2>
            <button onClick={resetFilters} className="text-sm font-black text-red-600">Clear</button>
          </div>
          <div className="mt-5 grid gap-4">
            <TextInput label="Keyword" value={filters.query} onChange={(event) => setFilter("query", event.target.value)} placeholder="Premio, hybrid, SUV..." />
            <SelectField label="City" value={filters.city} onChange={(event) => setFilter("city", event.target.value)}>{cities.map((item) => <option key={item}>{item}</option>)}</SelectField>
            <SelectField label="Make" value={filters.make} onChange={(event) => setFilter("make", event.target.value)}>{makes.map((item) => <option key={item}>{item}</option>)}</SelectField>
            <SelectField label="Budget" value={filters.budget} onChange={(event) => setFilter("budget", event.target.value)}>{budgetBands.map((item) => <option key={item.label}>{item.label}</option>)}</SelectField>
            <SelectField label="Body Type" value={filters.body} onChange={(event) => setFilter("body", event.target.value)}>{bodies.map((item) => <option key={item}>{item}</option>)}</SelectField>
            <SelectField label="Fuel" value={filters.fuel} onChange={(event) => setFilter("fuel", event.target.value)}>{fuels.map((item) => <option key={item}>{item}</option>)}</SelectField>
            <SelectField label="Transmission" value={filters.transmission} onChange={(event) => setFilter("transmission", event.target.value)}>{transmissions.map((item) => <option key={item}>{item}</option>)}</SelectField>
            <SelectField label="Seller" value={filters.sellerType} onChange={(event) => setFilter("sellerType", event.target.value)}>{sellerTypes.map((item) => <option key={item}>{item}</option>)}</SelectField>
            <SelectField label="Minimum Year" value={filters.minYear} onChange={(event) => setFilter("minYear", event.target.value)}>{["Any Year", "2015", "2017", "2020", "2023"].map((item) => <option key={item}>{item}</option>)}</SelectField>
            <SelectField label="Max Mileage" value={filters.mileageMax} onChange={(event) => setFilter("mileageMax", event.target.value)}>{["Any Mileage", "30000", "50000", "80000", "100000"].map((item) => <option key={item} value={item}>{item === "Any Mileage" ? item : `${Number(item).toLocaleString()} km`}</option>)}</SelectField>
            <div className="grid gap-2 pt-2">
              {[
                ["verifiedOnly", "Verified only"],
                ["inspectedOnly", "Inspected only"],
                ["certifiedOnly", "Certified only"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">
                  <input type="checkbox" checked={filters[key]} onChange={(event) => setFilter(key, event.target.checked)} />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </aside>

        <section>
          <div className="mb-4 flex flex-col justify-between gap-3 rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center">
            <div>
              <p className="font-black text-slate-950">Showing {filtered.length} of {listings.length} approved listings</p>
              <p className="text-sm font-bold text-slate-500">Saved {savedIds.length} - Compare {compareIds.length}/4</p>
            </div>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black outline-none">
              <option value="featured">Featured first</option>
              <option value="newest">Newest year</option>
              <option value="mileage">Lowest mileage</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </div>

          {filtered.length > 0 ? (
            <AnimatePresence mode="popLayout">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    saved={savedIds.includes(listing.id)}
                    compared={compareIds.includes(listing.id)}
                    onSave={onSave}
                    onCompare={onCompare}
                    onContact={onContact}
                  />
                ))}
              </div>
            </AnimatePresence>
          ) : (
            <div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
              <Search className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 text-xl font-black text-slate-950">No matching cars found</p>
              <p className="mt-2 font-medium text-slate-500">Try changing filters or create an alert for this search.</p>
              <Button className="mt-5" onClick={createAlert}><Bell className="h-4 w-4" /> Create alert</Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
