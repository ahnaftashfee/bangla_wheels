import { useState } from "react";
import { Package, Search, ShoppingCart, Trash2 } from "lucide-react";
import { Badge, Button, TextArea, TextInput } from "../components/ui";
import { partsCatalog } from "../data/marketplaceData";
import { formatBDT, idFor } from "../lib/marketplace";

export function PartsPage({ cart, setCart, orders, onCheckout }) {
  const [query, setQuery] = useState("");
  const [checkout, setCheckout] = useState({ name: "", phone: "", address: "" });
  const filtered = partsCatalog.filter((part) => `${part.title} ${part.category} ${part.brand} ${part.fitment}`.toLowerCase().includes(query.toLowerCase()));
  const cartItems = cart.map((item) => ({ ...item, part: partsCatalog.find((part) => part.id === item.partId) })).filter((item) => item.part);
  const total = cartItems.reduce((sum, item) => sum + item.qty * item.part.price, 0);

  const addToCart = (partId) => {
    setCart((current) => {
      const existing = current.find((item) => item.partId === partId);
      if (existing) return current.map((item) => item.partId === partId ? { ...item, qty: item.qty + 1 } : item);
      return [...current, { partId, qty: 1 }];
    });
  };

  const removeFromCart = (partId) => setCart((current) => current.filter((item) => item.partId !== partId));

  const submit = (event) => {
    event.preventDefault();
    if (cartItems.length === 0) return;
    onCheckout({
      id: idFor("order"),
      items: cartItems.map((item) => ({ partId: item.partId, title: item.part.title, qty: item.qty, price: item.part.price })),
      total,
      customer: checkout,
      status: "new",
      createdAt: new Date().toISOString(),
    });
    setCart([]);
    setCheckout({ name: "", phone: "", address: "" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge variant="purple"><Package className="h-3.5 w-3.5" /> Auto parts</Badge>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Parts, services, and document products</h1>
        </div>
        <Badge variant="green">{orders.length} orders tracked</Badge>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search parts, services, brand, fitment..." className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((part) => (
              <div key={part.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Package className="h-6 w-6" /></div>
                  <Badge>{part.category}</Badge>
                </div>
                <h2 className="mt-5 text-lg font-black">{part.title}</h2>
                <p className="mt-1 text-sm font-bold text-slate-500">{part.brand} - {part.city}</p>
                <p className="mt-4 text-2xl font-black text-red-600">{formatBDT(part.price)}</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{part.fitment}</p>
                <Button className="mt-5 w-full" variant="blue" onClick={() => addToCart(part.id)}>
                  <ShoppingCart className="h-4 w-4" /> Add to cart
                </Button>
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={submit} className="h-fit rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black">Cart</h2>
          <div className="mt-5 grid gap-3">
            {cartItems.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-500">No parts selected.</p>}
            {cartItems.map((item) => (
              <div key={item.partId} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="font-black">{item.part.title}</p>
                  <p className="text-sm font-bold text-slate-500">Qty {item.qty} - {formatBDT(item.part.price * item.qty)}</p>
                </div>
                <button type="button" onClick={() => removeFromCart(item.partId)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label="Remove item">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-slate-100 pt-5">
            <p className="flex justify-between text-lg font-black"><span>Total</span><span>{formatBDT(total)}</span></p>
            <div className="mt-4 grid gap-3">
              <TextInput label="Name" value={checkout.name} onChange={(event) => setCheckout((value) => ({ ...value, name: event.target.value }))} required={cartItems.length > 0} />
              <TextInput label="Phone" value={checkout.phone} onChange={(event) => setCheckout((value) => ({ ...value, phone: event.target.value }))} required={cartItems.length > 0} />
              <TextArea label="Delivery address" value={checkout.address} onChange={(event) => setCheckout((value) => ({ ...value, address: event.target.value }))} required={cartItems.length > 0} />
              <Button type="submit" disabled={cartItems.length === 0}>Place order</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
