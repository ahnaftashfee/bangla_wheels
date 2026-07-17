import {
  AlertCircle,
  BarChart3,
  Calculator,
  Car,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Fuel,
  Gauge,
  Heart,
  MapPin,
  Phone,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ListingCard } from "../components/ListingCard";
import { Badge, Button } from "../components/ui";
import { classNames, formatBDT, formatDate, go } from "../lib/marketplace";

export function ListingDetailPage({ listing, listings, saved, compared, onSave, onCompare, onContact }) {
  if (!listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <Car className="mx-auto h-12 w-12 text-slate-300" />
        <h1 className="mt-4 text-2xl font-black">Listing not found</h1>
        <p className="mt-2 text-slate-500">The car may have been removed or rejected by admin.</p>
        <Button className="mt-6" onClick={() => go("/buy")}>Back to listings</Button>
      </div>
    );
  }

  const similar = listings.filter((item) => item.id !== listing.id && (item.make === listing.make || item.body === listing.body)).slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <button onClick={() => go("/buy")} className="mb-5 text-sm font-black text-blue-700">Back to listings</button>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="relative h-[420px] bg-slate-200">
              <img src={listing.image} alt={listing.title} className="h-full w-full object-cover" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                {listing.status !== "approved" && <Badge variant="yellow">{listing.status}</Badge>}
                {listing.certified && <Badge variant="green"><ShieldCheck className="h-3.5 w-3.5" /> BanglaWheels Certified</Badge>}
                {listing.inspected && <Badge variant="blue"><FileCheck2 className="h-3.5 w-3.5" /> Inspected</Badge>}
              </div>
            </div>
            <div className="p-6 lg:p-8">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-950">{listing.title}</h1>
                  <p className="mt-2 flex items-center gap-2 font-bold text-slate-500"><MapPin className="h-4 w-4 text-red-500" /> {listing.area}, {listing.city}</p>
                  <p className="mt-4 text-4xl font-black text-red-600">{formatBDT(listing.price)}</p>
                  <p className="mt-1 text-sm font-bold text-slate-500">{listing.negotiable ? "Negotiable" : "Fixed price"} - Posted {formatDate(listing.postedAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant={saved ? "primary" : "secondary"} onClick={() => onSave(listing.id)}>
                    <Heart className={classNames("h-4 w-4", saved && "fill-white")} /> {saved ? "Saved" : "Save"}
                  </Button>
                  <Button variant={compared ? "blue" : "secondary"} onClick={() => onCompare(listing.id)}>
                    <BarChart3 className="h-4 w-4" /> {compared ? "Compared" : "Compare"}
                  </Button>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Year", listing.year, Car],
                  ["Mileage", `${listing.mileage.toLocaleString()} km`, Gauge],
                  ["Fuel", listing.fuel, Fuel],
                  ["Engine", listing.engine, Settings],
                  ["Body", listing.body, Car],
                  ["Transmission", listing.transmission, Settings],
                  ["Color", listing.color, Sparkles],
                  ["Reg. city", listing.registrationCity, MapPin],
                ].map(([label, value, Icon]) => (
                  <div key={label} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                    <Icon className="mb-3 h-5 w-5 text-blue-700" />
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
                    <p className="mt-1 font-black text-slate-900">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <div>
                  <h2 className="text-xl font-black">Description</h2>
                  <p className="mt-3 leading-7 text-slate-600">{listing.description}</p>
                </div>
                <div>
                  <h2 className="text-xl font-black">Features</h2>
                  <div className="mt-3 grid gap-2">
                    {listing.features.map((feature) => (
                      <p key={feature} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {feature}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-2xl bg-blue-50 p-5 ring-1 ring-blue-100">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <h2 className="text-xl font-black text-blue-950">Trust report</h2>
                    <p className="mt-1 text-sm font-bold text-blue-800">
                      {listing.inspected ? `Inspection score ${listing.inspectionScore}/100, auction grade ${listing.auctionGrade}.` : "No inspection report yet. Book one before token payment."}
                    </p>
                  </div>
                  <Button variant="blue" onClick={() => go(`/tools?tool=inspection&listing=${listing.id}`)}>
                    <ClipboardCheck className="h-4 w-4" /> Book inspection
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {similar.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 text-2xl font-black">Similar listings</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {similar.map((item) => (
                  <ListingCard key={item.id} listing={item} saved={false} compared={false} onSave={onSave} onCompare={onCompare} onContact={onContact} />
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <Badge variant={listing.verified ? "green" : "yellow"}>
            {listing.verified ? <ShieldCheck className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
            {listing.verified ? "Verified seller" : "Unverified seller"}
          </Badge>
          <h2 className="mt-4 text-2xl font-black">{listing.sellerName}</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">{listing.sellerType} - {listing.city}</p>
          <div className="mt-5 grid gap-3">
            <Button className="w-full" variant="blue" onClick={() => onContact(listing)}>
              <Phone className="h-4 w-4" /> Contact seller
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => go("/tools?tool=price")}>
              <Calculator className="h-4 w-4" /> Check fair price
            </Button>
          </div>
          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-500">Buyer safety checklist</p>
            <div className="mt-3 grid gap-2 text-sm font-bold text-slate-700">
              {["Inspect before token", "Verify registration papers", "Use bank transfer trail", "Meet in a safe public location"].map((item) => (
                <p key={item} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> {item}</p>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
