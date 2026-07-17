import { motion } from "framer-motion";
import {
  AlertCircle,
  BadgeCheck,
  BarChart3,
  Camera,
  Car,
  Check,
  Eye,
  Fuel,
  Gauge,
  Heart,
  MapPin,
  Phone,
  Settings,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Badge, Button } from "./ui";
import { classNames, formatBDT, go } from "../lib/marketplace";

export function ListingCard({ listing, saved, compared, onSave, onCompare, onContact }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.22 }}
      className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-xl"
    >
      <button onClick={() => go(`/listing/${listing.id}`)} className="relative block h-52 w-full overflow-hidden bg-slate-200 text-left">
        <img src={listing.image} alt={listing.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {listing.featured && <Badge variant="yellow"><Star className="h-3.5 w-3.5" /> Featured</Badge>}
          {listing.certified && <Badge variant="green"><BadgeCheck className="h-3.5 w-3.5" /> Certified</Badge>}
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-slate-950/75 px-3 py-1 text-xs font-bold text-white backdrop-blur">
          <Camera className="h-3.5 w-3.5" /> 12 photos
        </div>
        <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-slate-700">
          {formatBDT(listing.price)}
        </div>
      </button>

      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <Badge variant={listing.verified ? "green" : "default"}>
            {listing.verified ? <ShieldCheck className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
            {listing.verified ? "Verified seller" : "Needs verification"}
          </Badge>
          <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
            <Eye className="h-3.5 w-3.5" /> {listing.views.toLocaleString()}
          </span>
        </div>

        <button onClick={() => go(`/listing/${listing.id}`)} className="mt-3 block text-left">
          <h3 className="line-clamp-1 text-lg font-black text-slate-950">{listing.title}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-500">
            <MapPin className="h-4 w-4 text-red-500" /> {listing.area}, {listing.city}
          </p>
        </button>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-semibold text-slate-600">
          <div className="rounded-lg bg-slate-50 p-3"><Car className="mb-1 h-4 w-4 text-blue-700" /> {listing.year}</div>
          <div className="rounded-lg bg-slate-50 p-3"><Gauge className="mb-1 h-4 w-4 text-blue-700" /> {listing.mileage.toLocaleString()} km</div>
          <div className="rounded-lg bg-slate-50 p-3"><Fuel className="mb-1 h-4 w-4 text-blue-700" /> {listing.fuel}</div>
          <div className="rounded-lg bg-slate-50 p-3"><Settings className="mb-1 h-4 w-4 text-blue-700" /> {listing.engine}</div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
          <Button variant={saved ? "primary" : "secondary"} className="px-2" onClick={() => onSave(listing.id)}>
            <Heart className={classNames("h-4 w-4", saved && "fill-white")} />
          </Button>
          <Button variant={compared ? "blue" : "secondary"} className="px-2" onClick={() => onCompare(listing.id)}>
            {compared ? <Check className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
          </Button>
          <Button className="px-2" variant="blue" onClick={() => onContact(listing)}>
            <Phone className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
