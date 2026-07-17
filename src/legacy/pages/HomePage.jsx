import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Building2,
  Calculator,
  Car,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Gauge,
  Heart,
  LayoutDashboard,
  Package,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import heroImage from "../assets/hero.png";
import {
  adviceCards,
  categoryBrowse,
  cities,
  marketplaceServices,
  makes,
  usedCarsByCity,
  usedCarsByMakeModel,
  usedCarsByYear,
} from "../data/marketplaceData";
import { ListingCard } from "../components/ListingCard";
import { Badge, Button, SelectField, StatCard } from "../components/ui";
import { formatBDT, go } from "../lib/marketplace";

export function HomePage({ listings, savedIds, compareIds, onSave, onCompare, onContact, alertsCount, leadsCount }) {
  const [activeSearchTab, setActiveSearchTab] = useState("Used Cars");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All Cities");
  const [make, setMake] = useState("All Makes");
  const [financePrice, setFinancePrice] = useState("3500000");
  const [financeDownPayment, setFinanceDownPayment] = useState("30");
  const [financeTenure, setFinanceTenure] = useState("5");
  const featured = listings.filter((listing) => listing.featured).slice(0, 3);
  const financePreview = useMemo(() => {
    const principal = Math.max(0, Number(financePrice) * (1 - Number(financeDownPayment) / 100));
    const monthlyRate = 0.1125 / 12;
    const months = Number(financeTenure) * 12;
    return Math.round((principal * monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1));
  }, [financeDownPayment, financePrice, financeTenure]);

  const goWithFilters = (filters) => {
    const params = new URLSearchParams(filters);
    go(`/buy?${params.toString()}`);
  };

  const runSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (city !== "All Cities") params.set("city", city);
    if (make !== "All Makes") params.set("make", make);
    go(`/buy?${params.toString()}`);
  };

  return (
    <div>
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          <img src={heroImage} alt="" className="h-full w-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/92 to-slate-950/55" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-20">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <Badge variant="dark"><BadgeCheck className="h-3.5 w-3.5 text-red-400" /> Bangladesh car marketplace operating console</Badge>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight text-white sm:text-6xl">
              Buy, sell, inspect, finance, and manage cars from one place.
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-blue-100">
              BanglaWheels.com now has working marketplace flows: listings, saved ads, comparisons, seller leads, inspections, auto parts, dealer onboarding, and admin approval.
            </p>

            <form onSubmit={runSearch} className="mt-8 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-white/10">
              <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-100 pb-4">
                {["Used Cars", "New Cars", "Reconditioned", "Bikes", "Auto Parts"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveSearchTab(tab)}
                    className={`rounded-full px-4 py-2 text-sm font-black transition ${activeSearchTab === tab ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={`Search ${activeSearchTab.toLowerCase()} by make, model, city...`}
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
                <SelectField value={city} onChange={(event) => setCity(event.target.value)}>
                  {cities.map((item) => <option key={item}>{item}</option>)}
                </SelectField>
                <SelectField value={make} onChange={(event) => setMake(event.target.value)}>
                  {makes.map((item) => <option key={item}>{item}</option>)}
                </SelectField>
                <Button className="h-12" type="submit"><Search className="h-4 w-4" /> Search</Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                {["Toyota Premio", "Hybrid in Dhaka", "SUV", "Certified Dealer", "Low mileage"].map((item) => (
                  <button key={item} type="button" onClick={() => setSearch(item)} className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200 hover:bg-blue-50 hover:text-blue-700">
                    {item}
                  </button>
                ))}
              </div>
            </form>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
              <div className="rounded-xl bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-500">Live marketplace pulse</p>
                    <p className="mt-1 text-3xl font-black text-slate-950">{listings.length} listings</p>
                  </div>
                  <Badge variant="green"><Zap className="h-3.5 w-3.5" /> MVP active</Badge>
                </div>
                <div className="mt-5 grid gap-3">
                  {featured.map((listing) => (
                    <button key={listing.id} onClick={() => go(`/listing/${listing.id}`)} className="flex gap-3 rounded-xl bg-slate-50 p-3 text-left ring-1 ring-slate-100 hover:bg-blue-50">
                      <img src={listing.image} alt="" className="h-20 w-24 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-black text-slate-950">{listing.title}</p>
                        <p className="mt-1 text-sm font-bold text-red-600">{formatBDT(listing.price)}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">{listing.city} - {listing.mileage.toLocaleString()} km</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Approved listings" value={listings.length} icon={Car} tone="blue" />
          <StatCard label="Saved ads" value={savedIds.length} icon={Heart} tone="red" />
          <StatCard label="Buyer leads" value={leadsCount} icon={Phone} tone="green" />
          <StatCard label="Search alerts" value={alertsCount} icon={Bell} tone="yellow" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge variant="blue"><Sparkles className="h-3.5 w-3.5" /> Browse by category</Badge>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Find the right vehicle faster</h2>
          </div>
          <Button variant="secondary" onClick={() => go("/buy")}>All categories</Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categoryBrowse.map((category, index) => {
            const icons = [Car, Sparkles, Heart, ShieldCheck, Gauge, BadgeCheck, Building2, ClipboardCheck];
            const Icon = icons[index] || Car;
            return (
              <button
                key={category.title}
                onClick={() => goWithFilters(category.filter)}
                className="group rounded-xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700 group-hover:bg-blue-700 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-red-600" />
                </div>
                <p className="mt-4 font-black text-slate-950">{category.title}</p>
                <p className="mt-1 text-sm font-bold text-slate-500">{category.count} listings</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <Badge variant="blue"><Sparkles className="h-3.5 w-3.5" /> Core flows</Badge>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Run the marketplace from the first screen</h2>
          </div>
          <Button variant="secondary" onClick={() => go("/admin")}>Open admin</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Buy Cars", "Advanced filters, detail pages, saved cars, alerts, and seller leads.", Search, "/buy"],
            ["Sell a Car", "Post free ads, request Sell It For Me, and send listings to approval.", Plus, "/sell"],
            ["Trust Tools", "Price calculator, inspection booking, comparison, and auction checks.", ShieldCheck, "/tools"],
            ["Dealer Console", "Dealer profiles, packages, applications, and lead generation.", Building2, "/dealers"],
            ["Auto Parts", "Parts catalog, cart, checkout, and order tracking for admin.", Package, "/parts"],
            ["Admin Ops", "Approve ads, manage leads, bookings, dealer requests, and orders.", LayoutDashboard, "/admin"],
          ].map(([title, text, Icon, path]) => (
            <button key={title} onClick={() => go(path)} className="group rounded-xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700 group-hover:bg-blue-700 group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-red-600" />
              </div>
              <h3 className="mt-5 text-xl font-black text-slate-950">{title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <Badge variant="green"><CheckCircle2 className="h-3.5 w-3.5" /> BanglaWheels offerings</Badge>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Services for every step of ownership</h2>
            </div>
            <Button variant="secondary" onClick={() => go("/tools")}>Open tools</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {marketplaceServices.map((service) => {
              const iconMap = {
                "Sell It For Me": Phone,
                "Car Inspection": ClipboardCheck,
                "Auction Sheet Verification": FileCheck2,
                "Car Finance": Calculator,
                "Car Insurance": ShieldCheck,
                "Ownership Transfer": BadgeCheck,
              };
              const Icon = iconMap[service.title] || Sparkles;
              return (
                <button key={service.title} onClick={() => go(service.action)} className="group rounded-xl bg-slate-50 p-5 text-left ring-1 ring-slate-200 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-black text-slate-950">{service.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{service.text}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
          <Badge variant="dark"><Calculator className="h-3.5 w-3.5 text-red-400" /> Car loan calculator</Badge>
          <h2 className="mt-4 text-3xl font-black">Estimate monthly installments before calling sellers.</h2>
          <p className="mt-3 text-sm font-medium leading-6 text-blue-100">A quick finance preview for Bangladesh buyers. The full tool compares partner bank-style plans.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-black uppercase text-blue-200">Car price</span>
              <input value={financePrice} onChange={(event) => setFinancePrice(event.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-white/10 px-3 text-sm font-bold outline-none" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-black uppercase text-blue-200">Down payment %</span>
              <input value={financeDownPayment} onChange={(event) => setFinanceDownPayment(event.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-white/10 px-3 text-sm font-bold outline-none" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-black uppercase text-blue-200">Tenure years</span>
              <input value={financeTenure} onChange={(event) => setFinanceTenure(event.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-white/10 px-3 text-sm font-bold outline-none" />
            </label>
          </div>
          <p className="mt-6 text-4xl font-black">Tk {financePreview.toLocaleString()}/mo</p>
          <Button className="mt-5" variant="secondary" onClick={() => go("/tools?tool=finance")}>Compare finance plans</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <BrowseList title="Used Cars By Make Model" items={usedCarsByMakeModel.map(([label, count]) => ({ label, count, filters: { q: label } }))} />
          <BrowseList title="Used Cars By City" items={usedCarsByCity.map(([label, count]) => ({ label, count, filters: { city: label } }))} />
          <BrowseList title="Used Cars By Year" items={usedCarsByYear.map((label) => ({ label: `${label} Cars`, count: "Browse", filters: { minYear: label } }))} />
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <Badge variant="red"><TrendingUp className="h-3.5 w-3.5" /> Featured stock</Badge>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Cars ready for buyers</h2>
            </div>
            <Button variant="secondary" onClick={() => go("/buy")}>View all</Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((listing) => (
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
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-7">
          <Badge variant="yellow">Buyer advice</Badge>
          <h2 className="mt-3 text-3xl font-black tracking-tight">Guides that build trust before a transaction</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {adviceCards.map((card) => (
            <article key={card.title} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-xl font-black text-slate-950">{card.title}</h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{card.text}</p>
              <button onClick={() => go("/tools?tool=inspection")} className="mt-5 flex items-center gap-2 text-sm font-black text-blue-700">
                Open checklist <ArrowRight className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function BrowseList({ title, items }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h3 className="font-black text-slate-950">{title}</h3>
      <div className="mt-4 grid gap-2">
        {items.slice(0, 12).map((item) => (
          <button
            key={item.label}
            onClick={() => {
              const params = new URLSearchParams(item.filters);
              go(`/buy?${params.toString()}`);
            }}
            className="flex items-center justify-between rounded-lg px-2 py-2 text-left text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700"
          >
            <span>{item.label}</span>
            <span className="text-xs text-slate-400">{item.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
