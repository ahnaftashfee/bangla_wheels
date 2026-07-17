import { useState } from "react";
import { BarChart3, Heart } from "lucide-react";
import { Badge, Button, TextInput } from "../components/ui";
import { formatBDT, go } from "../lib/marketplace";

export function GaragePage({ savedListings, compareListings, alerts, leads, profile, setProfile, onSave, setCompareIds }) {
  const [draft, setDraft] = useState(profile);

  const saveProfile = (event) => {
    event.preventDefault();
    setProfile(draft);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Badge variant="red"><Heart className="h-3.5 w-3.5" /> My garage</Badge>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Buyer workspace</h1>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-8">
          <div>
            <h2 className="mb-4 text-2xl font-black">Saved listings</h2>
            {savedListings.length === 0 ? <p className="rounded-xl bg-white p-6 font-bold text-slate-500 ring-1 ring-slate-200">No saved cars yet.</p> : (
              <div className="grid gap-4 md:grid-cols-2">
                {savedListings.map((listing) => (
                  <div key={listing.id} className="flex gap-4 rounded-xl bg-white p-4 ring-1 ring-slate-200">
                    <img src={listing.image} alt="" className="h-24 w-32 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <button onClick={() => go(`/listing/${listing.id}`)} className="line-clamp-1 text-left font-black">{listing.title}</button>
                      <p className="mt-1 text-sm font-bold text-red-600">{formatBDT(listing.price)}</p>
                      <Button className="mt-3" variant="secondary" onClick={() => onSave(listing.id)}>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-black"><BarChart3 className="h-6 w-6 text-blue-700" /> Compare list</h2>
              <Button variant="secondary" onClick={() => setCompareIds([])}>Clear</Button>
            </div>
            {compareListings.length === 0 ? <p className="rounded-xl bg-white p-6 font-bold text-slate-500 ring-1 ring-slate-200">No compared cars yet.</p> : (
              <div className="grid gap-3">
                {compareListings.map((listing) => (
                  <button key={listing.id} onClick={() => go(`/listing/${listing.id}`)} className="flex items-center justify-between rounded-xl bg-white p-4 text-left ring-1 ring-slate-200 hover:bg-blue-50">
                    <span className="font-black">{listing.title}</span>
                    <span className="text-sm font-bold text-red-600">{formatBDT(listing.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="grid h-fit gap-5">
          <form onSubmit={saveProfile} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-black">Profile</h2>
            <div className="mt-5 grid gap-3">
              <TextInput label="Name" value={draft.name} onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))} />
              <TextInput label="Phone" value={draft.phone} onChange={(event) => setDraft((value) => ({ ...value, phone: event.target.value }))} />
              <TextInput label="Email" value={draft.email} onChange={(event) => setDraft((value) => ({ ...value, email: event.target.value }))} />
              <Button type="submit">Save profile</Button>
            </div>
          </form>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-black">Activity</h2>
            <div className="mt-4 grid gap-3 text-sm font-bold text-slate-600">
              <p className="flex justify-between"><span>Alerts</span><span>{alerts.length}</span></p>
              <p className="flex justify-between"><span>Seller leads sent</span><span>{leads.length}</span></p>
              <p className="flex justify-between"><span>Saved cars</span><span>{savedListings.length}</span></p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
