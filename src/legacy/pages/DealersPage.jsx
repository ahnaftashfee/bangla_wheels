import { useState } from "react";
import { CheckCircle2, Phone, ShieldCheck, Star, Store, Users, Car } from "lucide-react";
import { Badge, Button, SelectField, TextInput } from "../components/ui";
import { cities, dealerProfiles } from "../data/marketplaceData";
import { classNames, formatDate, idFor } from "../lib/marketplace";

export function DealersPage({ applications, onApply }) {
  const [form, setForm] = useState({ name: "", phone: "", showroom: "", city: "Dhaka", inventory: "20", plan: "Pro" });
  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    onApply({ id: idFor("dealer"), ...form, status: "new", createdAt: new Date().toISOString() });
    setForm({ name: "", phone: "", showroom: "", city: "Dhaka", inventory: "20", plan: "Pro" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge variant="blue"><Users className="h-3.5 w-3.5" /> Dealer network</Badge>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Dealer showrooms and subscription plans</h1>
          <p className="mt-3 max-w-3xl font-medium leading-7 text-slate-600">Create a revenue path with verified showrooms, boosted inventory, lead inboxes, analytics, and certification services.</p>
        </div>
        <Badge variant="green">{applications.length} applications captured</Badge>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {[
          ["Starter", "Tk 1,999/mo", "10 active listings"],
          ["Pro", "Tk 4,999/mo", "50 active listings"],
          ["Premium", "Tk 9,999/mo", "Featured slots, analytics, certification"],
        ].map(([plan, price, text], index) => (
          <div key={plan} className={classNames("rounded-2xl p-6 ring-1", index === 1 ? "bg-blue-700 text-white ring-blue-700 shadow-2xl shadow-blue-700/20" : "bg-white ring-slate-200")}>
            <p className="text-lg font-black">{plan}</p>
            <p className={classNames("mt-4 text-3xl font-black", index === 1 ? "text-white" : "text-red-600")}>{price}</p>
            <p className={classNames("mt-2 text-sm font-bold", index === 1 ? "text-blue-100" : "text-slate-500")}>{text}</p>
            <div className="mt-6 grid gap-2 text-sm font-bold">
              {["Dealer profile", "Lead inbox", "Listing boosts", "Verification badge"].map((item) => (
                <p key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> {item}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]">
        <section className="grid gap-4 md:grid-cols-3">
          {dealerProfiles.map((dealer) => (
            <div key={dealer.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Store className="h-6 w-6" /></div>
                {dealer.verified && <Badge variant="green"><ShieldCheck className="h-3.5 w-3.5" /> Verified</Badge>}
              </div>
              <h2 className="mt-5 text-xl font-black">{dealer.name}</h2>
              <p className="mt-1 text-sm font-bold text-slate-500">{dealer.area}, {dealer.city}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-black">
                <div className="rounded-lg bg-slate-50 p-3"><Star className="mb-1 h-4 w-4 text-amber-500" /> {dealer.rating}</div>
                <div className="rounded-lg bg-slate-50 p-3"><Car className="mb-1 h-4 w-4 text-blue-700" /> {dealer.inventory} cars</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {dealer.specialties.map((item) => <Badge key={item}>{item}</Badge>)}
              </div>
              <Button className="mt-5 w-full" variant="blue"><Phone className="h-4 w-4" /> {dealer.phone}</Button>
            </div>
          ))}
        </section>

        <form onSubmit={submit} className="h-fit rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black">Apply as a dealer</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">Applications appear in Admin for follow-up.</p>
          <div className="mt-5 grid gap-4">
            <TextInput label="Owner name" value={form.name} onChange={(event) => setValue("name", event.target.value)} required />
            <TextInput label="Phone" value={form.phone} onChange={(event) => setValue("phone", event.target.value)} required />
            <TextInput label="Showroom name" value={form.showroom} onChange={(event) => setValue("showroom", event.target.value)} required />
            <SelectField label="City" value={form.city} onChange={(event) => setValue("city", event.target.value)}>{cities.filter((item) => item !== "All Cities").map((item) => <option key={item}>{item}</option>)}</SelectField>
            <TextInput label="Current inventory" value={form.inventory} onChange={(event) => setValue("inventory", event.target.value)} />
            <SelectField label="Plan" value={form.plan} onChange={(event) => setValue("plan", event.target.value)}>{["Starter", "Pro", "Premium"].map((item) => <option key={item}>{item}</option>)}</SelectField>
            <Button type="submit">Submit dealer application</Button>
          </div>
          {applications.length > 0 && (
            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-500">Latest application</p>
              <p className="mt-2 font-bold">{applications[0].showroom}</p>
              <p className="text-xs font-bold text-slate-500">{formatDate(applications[0].createdAt)}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
