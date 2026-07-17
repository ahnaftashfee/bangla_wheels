import { useState } from "react";
import {
  Bell,
  Car,
  LogIn,
  Menu,
  Plus,
  X,
} from "lucide-react";
import { Button } from "./ui";
import { navItems } from "../lib/navigation";
import { classNames, go } from "../lib/marketplace";

export function Header({ route, profile, savedCount, compareCount }) {
  const [open, setOpen] = useState(false);

  const isActive = (path) => (path === "/" ? route.pathname === "/" : route.pathname.startsWith(path));

  return (
    <>
      <div className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-4 py-2 text-xs font-bold sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p className="flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-red-400" />
            Bangladesh-first marketplace MVP: listings, dealers, inspections, parts, alerts, admin
          </p>
          <div className="flex flex-wrap gap-4 text-slate-300">
            <button onClick={() => go("/sell")} className="hover:text-white">Post an Ad</button>
            <button onClick={() => go("/garage")} className="hover:text-white">Saved {savedCount}</button>
            <button onClick={() => go("/tools?tool=compare")} className="hover:text-white">Compare {compareCount}</button>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button onClick={() => go("/")} className="flex items-center gap-3 text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/25">
              <Car className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-slate-950">BanglaWheels<span className="text-red-600">.com</span></p>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Buy, sell, inspect, trust</p>
            </div>
          </button>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className={classNames(
                  "rounded-lg px-3 py-2 text-sm font-black transition",
                  isActive(item.path) ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100 hover:text-red-600",
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Button variant="secondary" onClick={() => go("/garage")}>
              <LogIn className="h-4 w-4" /> {profile.name.split(" ")[0]}
            </Button>
            <Button onClick={() => go("/sell")}><Plus className="h-4 w-4" /> Post Ad</Button>
          </div>

          <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>

        {open && (
          <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
            <div className="grid gap-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    go(item.path);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-black text-slate-700 hover:bg-slate-100"
                >
                  <item.icon className="h-4 w-4 text-blue-700" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
