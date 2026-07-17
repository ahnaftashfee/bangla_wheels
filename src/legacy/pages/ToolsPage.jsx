import { useMemo, useState } from "react";
import { BarChart3, Bell, Calculator, ClipboardCheck, FileCheck2, ShieldCheck, Trash2 } from "lucide-react";
import { Badge, Button, SelectField, TextArea, TextInput } from "../components/ui";
import { bankFinancePlans, cities, fuels, inspectionPackages, makes } from "../data/marketplaceData";
import {
  calculatePriceEstimate,
  formatBDT,
  formatDate,
  idFor,
} from "../lib/marketplace";

export function ToolsPage({ route, listings, compareIds, setCompareIds, bookings, onBookInspection, alerts, onToggleAlert, sheetChecks, onSheetCheck }) {
  const [tab, setTab] = useState(route.query.get("tool") || "price");

  const tabs = [
    ["price", "Price Calculator", Calculator],
    ["finance", "Loan Calculator", Calculator],
    ["inspection", "Inspection", ClipboardCheck],
    ["compare", "Compare", BarChart3],
    ["auction", "Auction Sheet", FileCheck2],
    ["ownership", "Ownership", ShieldCheck],
    ["alerts", "Alerts", Bell],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Badge variant="green">Buyer trust tools</Badge>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Tools that turn classifieds into a real product</h1>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
        {tabs.map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex min-w-fit items-center gap-2 rounded-lg px-4 py-2 text-sm font-black transition ${tab === key ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "price" && <PriceCalculator />}
      {tab === "finance" && <FinanceTool />}
      {tab === "inspection" && <InspectionTool listings={listings} route={route} bookings={bookings} onBookInspection={onBookInspection} />}
      {tab === "compare" && <CompareTool listings={listings} compareIds={compareIds} setCompareIds={setCompareIds} />}
      {tab === "auction" && <AuctionTool sheetChecks={sheetChecks} onSheetCheck={onSheetCheck} />}
      {tab === "ownership" && <OwnershipTool />}
      {tab === "alerts" && <AlertsTool alerts={alerts} onToggleAlert={onToggleAlert} />}
    </div>
  );
}

function PriceCalculator() {
  const [form, setForm] = useState({ make: "Toyota", year: "2018", mileage: "60000", fuel: "Hybrid", condition: "Good" });
  const estimate = useMemo(() => calculatePriceEstimate(form), [form]);
  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-black">Fair market price</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">A lightweight rules-based estimator using make, age, mileage, fuel, and condition.</p>
        <div className="mt-5 grid gap-4">
          <SelectField label="Make" value={form.make} onChange={(event) => setValue("make", event.target.value)}>{makes.filter((item) => item !== "All Makes").map((item) => <option key={item}>{item}</option>)}</SelectField>
          <TextInput label="Year" value={form.year} onChange={(event) => setValue("year", event.target.value)} />
          <TextInput label="Mileage" value={form.mileage} onChange={(event) => setValue("mileage", event.target.value)} />
          <SelectField label="Fuel" value={form.fuel} onChange={(event) => setValue("fuel", event.target.value)}>{fuels.filter((item) => item !== "Any Fuel").map((item) => <option key={item}>{item}</option>)}</SelectField>
          <SelectField label="Condition" value={form.condition} onChange={(event) => setValue("condition", event.target.value)}>{["Excellent", "Good", "Average", "Needs Work"].map((item) => <option key={item}>{item}</option>)}</SelectField>
        </div>
      </div>
      <div className="rounded-2xl bg-slate-950 p-8 text-white shadow-sm">
        <Badge variant="dark">Estimated range</Badge>
        <p className="mt-6 text-5xl font-black">{formatBDT(estimate.midpoint)}</p>
        <p className="mt-3 text-lg font-bold text-blue-100">{formatBDT(estimate.low)} - {formatBDT(estimate.high)}</p>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {[
            ["Buyer target", estimate.low],
            ["Fair ask", estimate.midpoint],
            ["Premium ask", estimate.high],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-xs font-black uppercase text-blue-200">{label}</p>
              <p className="mt-2 text-xl font-black">{formatBDT(value)}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm font-medium leading-6 text-slate-300">Next backend step: train this with Bangladesh transaction data, dealer close prices, inspection scores, and registration costs.</p>
      </div>
    </div>
  );
}

function FinanceTool() {
  const [form, setForm] = useState({
    vehicleType: "Used Cars",
    city: "Dhaka",
    price: "3500000",
    downPayment: "30",
    tenure: "5",
  });
  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const price = Number(form.price) || 0;
  const downPaymentAmount = Math.round(price * (Number(form.downPayment) / 100));
  const principal = Math.max(0, price - downPaymentAmount);
  const tenureMonths = Math.max(12, Number(form.tenure) * 12);

  const offers = bankFinancePlans.map((plan) => {
    const monthlyRate = plan.rate / 100 / 12;
    const installment = Math.round((principal * monthlyRate * (1 + monthlyRate) ** tenureMonths) / ((1 + monthlyRate) ** tenureMonths - 1));
    const processingFee = Math.round(price * (plan.processingFee / 100));
    const insurance = Math.round(price * (plan.insurance / 100));
    return {
      ...plan,
      installment,
      processingFee,
      insurance,
      initialDeposit: downPaymentAmount + processingFee + insurance,
      totalPayable: installment * tenureMonths + downPaymentAmount + processingFee + insurance,
    };
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-black">Car loan and finance calculator</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">Compare installment estimates, upfront deposit, insurance, processing fee, and total payable.</p>
        <div className="mt-5 grid gap-4">
          <SelectField label="Vehicle type" value={form.vehicleType} onChange={(event) => setValue("vehicleType", event.target.value)}>
            {["New Cars", "Used Cars", "Reconditioned"].map((item) => <option key={item}>{item}</option>)}
          </SelectField>
          <SelectField label="City" value={form.city} onChange={(event) => setValue("city", event.target.value)}>
            {cities.filter((item) => item !== "All Cities").map((item) => <option key={item}>{item}</option>)}
          </SelectField>
          <TextInput label="Car price" value={form.price} onChange={(event) => setValue("price", event.target.value)} />
          <SelectField label="Down payment" value={form.downPayment} onChange={(event) => setValue("downPayment", event.target.value)}>
            {["25", "30", "35", "40", "50", "60", "70"].map((item) => <option key={item} value={item}>{item}%</option>)}
          </SelectField>
          <SelectField label="Tenure" value={form.tenure} onChange={(event) => setValue("tenure", event.target.value)}>
            {["1", "2", "3", "4", "5", "6", "7"].map((item) => <option key={item} value={item}>{item} years</option>)}
          </SelectField>
          <TextArea label="Applicant notes" placeholder="Monthly income, profession, preferred bank, or Islamic finance preference." />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-xl font-black">Partner-style offers</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">Illustrative estimates for product planning. Real bank APIs can replace this table later.</p>
          </div>
          <Badge variant="blue">Principal {formatBDT(principal)}</Badge>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[780px] border-separate border-spacing-0 overflow-hidden rounded-xl text-left text-sm">
            <thead>
              <tr>
                {["Bank", "Rate", "Monthly", "Initial deposit", "Insurance", "Total payable"].map((heading) => (
                  <th key={heading} className="bg-slate-950 p-4 text-white">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.bank}>
                  <td className="border-b border-slate-100 p-4 font-black">{offer.bank}</td>
                  <td className="border-b border-slate-100 p-4 font-bold">{offer.rate}%</td>
                  <td className="border-b border-slate-100 p-4 font-black text-red-600">{formatBDT(offer.installment)}</td>
                  <td className="border-b border-slate-100 p-4 font-bold">{formatBDT(offer.initialDeposit)}</td>
                  <td className="border-b border-slate-100 p-4 font-bold">{formatBDT(offer.insurance)}</td>
                  <td className="border-b border-slate-100 p-4 font-bold">{formatBDT(offer.totalPayable)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 rounded-xl bg-blue-50 p-4 text-sm font-bold text-blue-900">
          Common documents: NID, photos, 6-month bank statement, income proof, employment/business proof, and vehicle quotation.
        </div>
      </div>
    </div>
  );
}

function InspectionTool({ listings, route, bookings, onBookInspection }) {
  const preselected = route.query.get("listing") || listings[0]?.id || "";
  const [form, setForm] = useState({ listingId: preselected, name: "", phone: "", city: "Dhaka", packageId: "standard", preferredDate: "" });
  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    const listing = listings.find((item) => item.id === form.listingId);
    const selectedPackage = inspectionPackages.find((item) => item.id === form.packageId);
    onBookInspection({
      id: idFor("inspection"),
      ...form,
      listingTitle: listing?.title || "Manual inspection",
      packageName: selectedPackage.name,
      price: selectedPackage.price,
      status: "requested",
      createdAt: new Date().toISOString(),
    });
    setForm((value) => ({ ...value, name: "", phone: "", preferredDate: "" }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <section className="grid gap-4 md:grid-cols-3">
        {inspectionPackages.map((pack) => (
          <div key={pack.id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <ClipboardCheck className="h-8 w-8 text-blue-700" />
            <h2 className="mt-4 text-xl font-black">{pack.name}</h2>
            <p className="mt-2 text-3xl font-black text-red-600">{formatBDT(pack.price)}</p>
            <p className="mt-2 text-sm font-bold text-slate-500">{pack.points}+ checkpoints - {pack.eta}</p>
          </div>
        ))}
      </section>
      <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-black">Book inspection</h2>
        <div className="mt-5 grid gap-4">
          <SelectField label="Listing" value={form.listingId} onChange={(event) => setValue("listingId", event.target.value)}>{listings.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</SelectField>
          <TextInput label="Name" value={form.name} onChange={(event) => setValue("name", event.target.value)} required />
          <TextInput label="Phone" value={form.phone} onChange={(event) => setValue("phone", event.target.value)} required />
          <SelectField label="City" value={form.city} onChange={(event) => setValue("city", event.target.value)}>{cities.filter((item) => item !== "All Cities").map((item) => <option key={item}>{item}</option>)}</SelectField>
          <SelectField label="Package" value={form.packageId} onChange={(event) => setValue("packageId", event.target.value)}>{inspectionPackages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>
          <TextInput label="Preferred date" type="date" value={form.preferredDate} onChange={(event) => setValue("preferredDate", event.target.value)} />
          <Button type="submit" variant="blue">Request inspection</Button>
        </div>
        <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-600">{bookings.length} bookings are currently tracked in Admin.</div>
      </form>
    </div>
  );
}

function CompareTool({ listings, compareIds, setCompareIds }) {
  const selected = listings.filter((listing) => compareIds.includes(listing.id)).slice(0, 4);
  const addId = (id) => {
    setCompareIds((current) => current.includes(id) ? current : [...current, id].slice(-4));
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-xl font-black">Compare cars</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">Select up to four cars and compare specs side by side.</p>
        </div>
        <div className="flex gap-2">
          <select onChange={(event) => event.target.value && addId(event.target.value)} value="" className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-black outline-none">
            <option value="">Add car</option>
            {listings.map((listing) => <option value={listing.id} key={listing.id}>{listing.title}</option>)}
          </select>
          <Button variant="secondary" onClick={() => setCompareIds([])}><Trash2 className="h-4 w-4" /> Clear</Button>
        </div>
      </div>

      {selected.length === 0 ? (
        <div className="mt-6 rounded-xl bg-slate-50 p-10 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-black">No cars selected</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 overflow-hidden rounded-xl text-left text-sm">
            <thead>
              <tr>
                <th className="bg-slate-950 p-4 text-white">Spec</th>
                {selected.map((listing) => <th key={listing.id} className="bg-slate-950 p-4 text-white">{listing.title}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ["Price", (item) => formatBDT(item.price)],
                ["Year", (item) => item.year],
                ["Mileage", (item) => `${item.mileage.toLocaleString()} km`],
                ["Fuel", (item) => item.fuel],
                ["Engine", (item) => item.engine],
                ["Body", (item) => item.body],
                ["Seller", (item) => item.sellerName],
                ["Inspection", (item) => item.inspected ? `${item.inspectionScore}/100` : "Not inspected"],
              ].map(([label, getValue]) => (
                <tr key={label}>
                  <td className="border-b border-slate-100 bg-slate-50 p-4 font-black">{label}</td>
                  {selected.map((listing) => <td key={listing.id} className="border-b border-slate-100 p-4 font-bold text-slate-700">{getValue(listing)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AuctionTool({ sheetChecks, onSheetCheck }) {
  const [form, setForm] = useState({ chassis: "", lot: "", email: "" });

  const submit = (event) => {
    event.preventDefault();
    const confidence = Math.min(98, 72 + form.chassis.length + form.lot.length);
    onSheetCheck({
      id: idFor("sheet"),
      ...form,
      status: confidence > 84 ? "matched" : "manual review",
      grade: confidence > 84 ? "4.5" : "Pending",
      confidence,
      createdAt: new Date().toISOString(),
    });
    setForm({ chassis: "", lot: "", email: "" });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-black">Auction sheet check</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">Prototype verification flow for Japanese import documents.</p>
        <div className="mt-5 grid gap-4">
          <TextInput label="Chassis number" value={form.chassis} onChange={(event) => setForm((value) => ({ ...value, chassis: event.target.value }))} required />
          <TextInput label="Auction lot number" value={form.lot} onChange={(event) => setForm((value) => ({ ...value, lot: event.target.value }))} required />
          <TextInput label="Email or phone" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} required />
          <Button type="submit" variant="blue">Run verification</Button>
        </div>
      </form>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-black">Recent checks</h2>
        <div className="mt-5 grid gap-3">
          {sheetChecks.length === 0 && <p className="rounded-xl bg-slate-50 p-5 text-sm font-bold text-slate-500">No checks yet.</p>}
          {sheetChecks.slice(0, 6).map((check) => (
            <div key={check.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black">{check.chassis}</p>
                <Badge variant={check.status === "matched" ? "green" : "yellow"}>{check.status}</Badge>
              </div>
              <p className="mt-1 text-sm font-bold text-slate-500">Lot {check.lot} - confidence {check.confidence}% - grade {check.grade}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AlertsTool({ alerts, onToggleAlert }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xl font-black">Saved search alerts</h2>
      <div className="mt-5 grid gap-3">
        {alerts.length === 0 && <p className="rounded-xl bg-slate-50 p-5 text-sm font-bold text-slate-500">Create alerts from the Buy Cars page.</p>}
        {alerts.map((alert) => (
          <div key={alert.id} className="flex flex-col justify-between gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100 md:flex-row md:items-center">
            <div>
              <p className="font-black">{alert.name}</p>
              <p className="mt-1 text-sm font-bold text-slate-500">{alert.matches} matches when created - {formatDate(alert.createdAt)}</p>
            </div>
            <Button variant={alert.active ? "primary" : "secondary"} onClick={() => onToggleAlert(alert.id)}>
              {alert.active ? "Active" : "Paused"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function OwnershipTool() {
  const [price, setPrice] = useState("3500000");
  const [registrationCity, setRegistrationCity] = useState("Dhaka");
  const vehiclePrice = Number(price) || 0;
  const transferFee = Math.round(vehiclePrice * 0.012);
  const taxToken = registrationCity === "Dhaka" ? 18000 : 14500;
  const insurance = Math.round(vehiclePrice * 0.0125);
  const serviceFee = 6500;
  const total = transferFee + taxToken + insurance + serviceFee;

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-black">Ownership transfer estimator</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">Estimate transfer, tax token, insurance, and service support before finalizing the deal.</p>
        <div className="mt-5 grid gap-4">
          <TextInput label="Vehicle price" value={price} onChange={(event) => setPrice(event.target.value)} />
          <SelectField label="Registration city" value={registrationCity} onChange={(event) => setRegistrationCity(event.target.value)}>
            {cities.filter((item) => item !== "All Cities").map((item) => <option key={item}>{item}</option>)}
          </SelectField>
        </div>
      </div>
      <div className="rounded-2xl bg-slate-950 p-8 text-white">
        <Badge variant="dark">Estimated ownership cost</Badge>
        <p className="mt-6 text-5xl font-black">{formatBDT(total)}</p>
        <div className="mt-8 grid gap-3 md:grid-cols-4">
          {[
            ["Transfer", transferFee],
            ["Tax token", taxToken],
            ["Insurance", insurance],
            ["Service", serviceFee],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-xs font-black uppercase text-blue-200">{label}</p>
              <p className="mt-2 text-xl font-black">{formatBDT(value)}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl bg-white/10 p-4 text-sm font-semibold leading-6 text-slate-200">
          Checklist: registration certificate, tax token, fitness, NID copy, transfer form, bank clearance if financed, insurance update, and delivery receipt.
        </div>
      </div>
    </div>
  );
}
