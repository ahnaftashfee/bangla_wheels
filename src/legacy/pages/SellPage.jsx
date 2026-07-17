import { useState } from "react";
import { Camera, CheckCircle2, Plus } from "lucide-react";
import { Badge, Button, SelectField, TextArea, TextInput } from "../components/ui";
import { bodies, cities, fuels, makes, sellerTypes, transmissions } from "../data/marketplaceData";
import { formatBDT, go, idFor, numberFrom } from "../lib/marketplace";

export function SellPage({ onCreateListing, defaultImage, profile }) {
  const [form, setForm] = useState({
    title: "",
    make: "Toyota",
    model: "",
    year: "2020",
    price: "",
    city: "Dhaka",
    area: "",
    mileage: "",
    fuel: "Petrol",
    transmission: "Automatic",
    body: "Sedan",
    engine: "1500cc",
    color: "",
    registrationCity: "Dhaka Metro",
    sellerType: "Private Seller",
    sellerName: profile.name,
    phone: profile.phone,
    image: "",
    features: "Original documents, Clean interior, AC working",
    description: "",
    sellItForMe: false,
  });

  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    const listing = {
      id: idFor("bw"),
      title: form.title || `${form.make} ${form.model} ${form.year}`,
      make: form.make,
      model: form.model || "Unknown",
      year: numberFrom(form.year),
      price: numberFrom(form.price),
      city: form.city,
      area: form.area || "Not specified",
      mileage: numberFrom(form.mileage),
      fuel: form.fuel,
      transmission: form.transmission,
      body: form.body,
      engine: form.engine,
      color: form.color || "Not specified",
      registrationCity: form.registrationCity,
      sellerType: form.sellerType,
      sellerName: form.sellerName,
      phone: form.phone,
      verified: false,
      featured: false,
      inspected: false,
      certified: false,
      negotiable: true,
      status: "pending",
      postedAt: new Date().toISOString(),
      views: 0,
      inspectionScore: null,
      auctionGrade: "Pending",
      image: form.image || defaultImage,
      features: form.features.split(",").map((item) => item.trim()).filter(Boolean),
      description: form.description || "Seller has submitted this car for BanglaWheels admin review.",
      sellItForMe: form.sellItForMe,
    };
    onCreateListing(listing);
    go(`/listing/${listing.id}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_0.75fr] lg:items-end">
        <div>
          <Badge variant="red"><Plus className="h-3.5 w-3.5" /> Seller center</Badge>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Post a car ad that enters the real workflow</h1>
          <p className="mt-3 max-w-3xl font-medium leading-7 text-slate-600">
            Submitted cars are saved locally as pending ads. Admin can approve, certify, inspect, feature, or reject them.
          </p>
        </div>
        <div className="rounded-xl bg-slate-950 p-5 text-white">
          <p className="text-sm font-black text-blue-200">Revenue hooks included</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {["Featured ads", "Dealer plans", "Inspection fees", "Sell It For Me"].map((item) => (
              <p key={item} className="flex items-center gap-2 text-sm font-black"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> {item}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="Ad title" value={form.title} onChange={(event) => setValue("title", event.target.value)} placeholder="Toyota Premio 1.5F L Package" />
            <TextInput label="Expected price" value={form.price} onChange={(event) => setValue("price", event.target.value)} placeholder="3820000" required />
            <SelectField label="Make" value={form.make} onChange={(event) => setValue("make", event.target.value)}>{makes.filter((item) => item !== "All Makes").map((item) => <option key={item}>{item}</option>)}</SelectField>
            <TextInput label="Model" value={form.model} onChange={(event) => setValue("model", event.target.value)} placeholder="Premio" required />
            <TextInput label="Year" value={form.year} onChange={(event) => setValue("year", event.target.value)} required />
            <TextInput label="Mileage" value={form.mileage} onChange={(event) => setValue("mileage", event.target.value)} placeholder="62000" required />
            <SelectField label="City" value={form.city} onChange={(event) => setValue("city", event.target.value)}>{cities.filter((item) => item !== "All Cities").map((item) => <option key={item}>{item}</option>)}</SelectField>
            <TextInput label="Area" value={form.area} onChange={(event) => setValue("area", event.target.value)} placeholder="Uttara" />
            <SelectField label="Fuel" value={form.fuel} onChange={(event) => setValue("fuel", event.target.value)}>{fuels.filter((item) => item !== "Any Fuel").map((item) => <option key={item}>{item}</option>)}</SelectField>
            <SelectField label="Transmission" value={form.transmission} onChange={(event) => setValue("transmission", event.target.value)}>{transmissions.filter((item) => item !== "Any Transmission").map((item) => <option key={item}>{item}</option>)}</SelectField>
            <SelectField label="Body type" value={form.body} onChange={(event) => setValue("body", event.target.value)}>{bodies.filter((item) => item !== "Any Body").map((item) => <option key={item}>{item}</option>)}</SelectField>
            <TextInput label="Engine" value={form.engine} onChange={(event) => setValue("engine", event.target.value)} />
            <TextInput label="Color" value={form.color} onChange={(event) => setValue("color", event.target.value)} />
            <TextInput label="Registration city" value={form.registrationCity} onChange={(event) => setValue("registrationCity", event.target.value)} />
            <SelectField label="Seller type" value={form.sellerType} onChange={(event) => setValue("sellerType", event.target.value)}>{sellerTypes.filter((item) => item !== "Any Seller").map((item) => <option key={item}>{item}</option>)}</SelectField>
            <TextInput label="Phone" value={form.phone} onChange={(event) => setValue("phone", event.target.value)} required />
            <TextInput label="Seller name" value={form.sellerName} onChange={(event) => setValue("sellerName", event.target.value)} required />
            <TextInput label="Image URL" value={form.image} onChange={(event) => setValue("image", event.target.value)} placeholder="Optional" />
          </div>
          <div className="mt-4 grid gap-4">
            <TextArea label="Features, comma separated" value={form.features} onChange={(event) => setValue("features", event.target.value)} />
            <TextArea label="Description" value={form.description} onChange={(event) => setValue("description", event.target.value)} placeholder="Tell buyers about condition, documents, accident history, and transfer readiness." />
            <label className="flex items-center gap-3 rounded-xl bg-blue-50 p-4 text-sm font-black text-blue-900">
              <input type="checkbox" checked={form.sellItForMe} onChange={(event) => setValue("sellItForMe", event.target.checked)} />
              Request BanglaWheels Sell It For Me assistance
            </label>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="submit"><Plus className="h-4 w-4" /> Submit for approval</Button>
            <Button type="button" variant="secondary" onClick={() => go("/admin")}>Review queue</Button>
          </div>
        </form>

        <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-black">Live preview</h2>
          <div className="mt-4 overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200">
            <img src={form.image || defaultImage} alt="" className="h-48 w-full object-cover" />
            <div className="p-4">
              <p className="font-black">{form.title || `${form.make} ${form.model || "Model"} ${form.year}`}</p>
              <p className="mt-1 text-sm font-bold text-slate-500">{form.area || "Area"}, {form.city}</p>
              <p className="mt-3 text-2xl font-black text-red-600">{formatBDT(numberFrom(form.price))}</p>
              <div className="mt-4 grid gap-2 text-sm font-bold text-slate-600">
                {["Admin approval required", "Seller phone verification", "Optional inspection upsell", "Lead tracking after publish"].map((item) => (
                  <p key={item} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> {item}</p>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <Camera className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-black text-slate-700">Photo uploads will connect to storage in the backend phase.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
