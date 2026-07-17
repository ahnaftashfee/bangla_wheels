import {
  Car,
  Clock3,
  Crown,
  LayoutDashboard,
  Phone,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import { AdminPanel, AdminQueue, Badge, Button, StatCard } from "../components/ui";
import { formatBDT, go } from "../lib/marketplace";

export function AdminPage({ listings, setListings, leads, setLeads, bookings, setBookings, applications, setApplications, orders, setOrders, sheetChecks, resetDemoData }) {
  const pending = listings.filter((listing) => listing.status === "pending");
  const approved = listings.filter((listing) => listing.status === "approved");
  const updateListing = (id, patch) => setListings((current) => current.map((listing) => listing.id === id ? { ...listing, ...patch } : listing));
  const updateLead = (id, patch) => setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, ...patch } : lead));
  const updateBooking = (id, patch) => setBookings((current) => current.map((booking) => booking.id === id ? { ...booking, ...patch } : booking));
  const updateApplication = (id, patch) => setApplications((current) => current.map((application) => application.id === id ? { ...application, ...patch } : application));
  const updateOrder = (id, patch) => setOrders((current) => current.map((order) => order.id === id ? { ...order, ...patch } : order));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge variant="dark"><LayoutDashboard className="h-3.5 w-3.5 text-red-400" /> Admin</Badge>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Marketplace control center</h1>
          <p className="mt-3 max-w-3xl font-medium leading-7 text-slate-600">Moderate listings, handle leads, manage inspection bookings, process dealer applications, and track parts orders.</p>
        </div>
        <Button variant="secondary" onClick={resetDemoData}><RefreshCw className="h-4 w-4" /> Restore demo data</Button>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <StatCard label="Pending ads" value={pending.length} icon={Clock3} tone="yellow" />
        <StatCard label="Approved ads" value={approved.length} icon={Car} tone="blue" />
        <StatCard label="Leads" value={leads.length} icon={Phone} tone="green" />
        <StatCard label="Orders" value={orders.length} icon={ShoppingCart} tone="red" />
      </div>

      <div className="grid gap-8">
        <AdminPanel title="Listing moderation" subtitle="Approve seller submissions and add marketplace trust labels.">
          <div className="grid gap-3">
            {pending.length === 0 && <p className="rounded-xl bg-slate-50 p-5 text-sm font-bold text-slate-500">No pending listings.</p>}
            {pending.map((listing) => (
              <div key={listing.id} className="flex flex-col justify-between gap-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100 lg:flex-row lg:items-center">
                <div className="flex gap-4">
                  <img src={listing.image} alt="" className="h-24 w-32 rounded-lg object-cover" />
                  <div>
                    <p className="font-black">{listing.title}</p>
                    <p className="mt-1 text-sm font-bold text-slate-500">{listing.sellerName} - {listing.city} - {formatBDT(listing.price)}</p>
                    {listing.sellItForMe && <Badge className="mt-2" variant="purple"><Crown className="h-3.5 w-3.5" /> Sell It For Me</Badge>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="blue" onClick={() => updateListing(listing.id, { status: "approved", verified: true })}>Approve</Button>
                  <Button variant="secondary" onClick={() => updateListing(listing.id, { status: "approved", verified: true, inspected: true, inspectionScore: 90, certified: true })}>Certify</Button>
                  <Button variant="secondary" onClick={() => updateListing(listing.id, { status: "approved", featured: true })}>Feature</Button>
                  <Button variant="ghost" onClick={() => updateListing(listing.id, { status: "rejected" })}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Approved inventory" subtitle="Toggle marketplace badges and placement.">
          <div className="grid gap-3 md:grid-cols-2">
            {approved.map((listing) => (
              <div key={listing.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{listing.title}</p>
                    <p className="mt-1 text-sm font-bold text-slate-500">{listing.city} - {formatBDT(listing.price)}</p>
                  </div>
                  <button onClick={() => go(`/listing/${listing.id}`)} className="text-sm font-black text-blue-700">View</button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant={listing.featured ? "primary" : "secondary"} onClick={() => updateListing(listing.id, { featured: !listing.featured })}>Featured</Button>
                  <Button variant={listing.certified ? "blue" : "secondary"} onClick={() => updateListing(listing.id, { certified: !listing.certified, verified: true })}>Certified</Button>
                  <Button variant={listing.inspected ? "blue" : "secondary"} onClick={() => updateListing(listing.id, { inspected: !listing.inspected, inspectionScore: listing.inspected ? null : 88 })}>Inspected</Button>
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Leads and bookings" subtitle="Operational queues generated from buyer actions.">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 font-black">Seller leads</h3>
              <div className="grid gap-3">
                {leads.length === 0 && <p className="rounded-xl bg-slate-50 p-5 text-sm font-bold text-slate-500">No leads yet.</p>}
                {leads.map((lead) => (
                  <div key={lead.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black">{lead.buyerName}</p>
                      <Badge variant={lead.status === "new" ? "yellow" : "green"}>{lead.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-500">{lead.listingTitle} - {lead.buyerPhone}</p>
                    <Button className="mt-3" variant="secondary" onClick={() => updateLead(lead.id, { status: "contacted" })}>Mark contacted</Button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-black">Inspection bookings</h3>
              <div className="grid gap-3">
                {bookings.length === 0 && <p className="rounded-xl bg-slate-50 p-5 text-sm font-bold text-slate-500">No inspection bookings yet.</p>}
                {bookings.map((booking) => (
                  <div key={booking.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black">{booking.listingTitle}</p>
                      <Badge variant={booking.status === "completed" ? "green" : "blue"}>{booking.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-500">{booking.packageName} - {booking.city} - {booking.phone}</p>
                    <div className="mt-3 flex gap-2">
                      <Button variant="secondary" onClick={() => updateBooking(booking.id, { status: "scheduled" })}>Schedule</Button>
                      <Button variant="blue" onClick={() => updateBooking(booking.id, { status: "completed" })}>Complete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel title="Dealer, parts, and document ops" subtitle="Queues from dealer applications, cart checkout, and auction checks.">
          <div className="grid gap-6 lg:grid-cols-3">
            <AdminQueue title="Dealer applications" items={applications} empty="No dealer applications yet.">
              {(item) => (
                <div key={item.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  <p className="font-black">{item.showroom}</p>
                  <p className="mt-1 text-sm font-bold text-slate-500">{item.name} - {item.phone} - {item.plan}</p>
                  <Button className="mt-3" variant="secondary" onClick={() => updateApplication(item.id, { status: "approved" })}>Approve</Button>
                </div>
              )}
            </AdminQueue>
            <AdminQueue title="Parts orders" items={orders} empty="No parts orders yet.">
              {(item) => (
                <div key={item.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  <p className="font-black">{item.customer.name || "Customer"}</p>
                  <p className="mt-1 text-sm font-bold text-slate-500">{item.items.length} items - {formatBDT(item.total)}</p>
                  <Button className="mt-3" variant="secondary" onClick={() => updateOrder(item.id, { status: "processing" })}>Process</Button>
                </div>
              )}
            </AdminQueue>
            <AdminQueue title="Auction checks" items={sheetChecks} empty="No document checks yet.">
              {(item) => (
                <div key={item.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  <p className="font-black">{item.chassis}</p>
                  <p className="mt-1 text-sm font-bold text-slate-500">Lot {item.lot} - {item.status} - {item.confidence}%</p>
                </div>
              )}
            </AdminQueue>
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
