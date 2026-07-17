import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Phone, X } from "lucide-react";
import { Badge, Button, TextArea, TextInput } from "./ui";
import { formatBDT, idFor } from "../lib/marketplace";

export function ContactModal({ listing, profile, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: profile.name,
    phone: profile.phone,
    message: "I am interested in this car. Please contact me with availability and final price.",
  });

  if (!listing) return null;

  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      id: idFor("lead"),
      listingId: listing.id,
      listingTitle: listing.title,
      sellerName: listing.sellerName,
      sellerPhone: listing.phone,
      buyerName: form.name,
      buyerPhone: form.phone,
      message: form.message,
      status: "new",
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-slate-950/70 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.form
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          onSubmit={submit}
          className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="grid md:grid-cols-[0.9fr_1.1fr]">
            <img src={listing.image} alt={listing.title} className="h-64 w-full object-cover md:h-full" />
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="green"><Phone className="h-3.5 w-3.5" /> Seller lead</Badge>
                  <h3 className="mt-3 text-2xl font-black text-slate-950">{listing.title}</h3>
                  <p className="mt-1 text-sm font-bold text-slate-500">{listing.sellerName} - {listing.city}</p>
                </div>
                <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100" aria-label="Close contact form">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 grid gap-3">
                <TextInput label="Your name" value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} required />
                <TextInput label="Phone number" value={form.phone} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} required />
                <TextArea label="Message" value={form.message} onChange={(event) => setForm((value) => ({ ...value, message: event.target.value }))} />
              </div>

              <div className="mt-5 rounded-xl bg-blue-50 p-4 text-sm font-bold text-blue-900">
                Seller phone: {listing.phone}. Asking price: {formatBDT(listing.price)}. Submitting also creates a lead in the admin dashboard.
              </div>
              <Button className="mt-5 w-full" type="submit" variant="blue">
                Send lead and show phone
              </Button>
            </div>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
}
