import { navItems } from "../lib/navigation";
import { go } from "../lib/marketplace";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row lg:px-8">
        <div>
          <p className="text-2xl font-black">BanglaWheels<span className="text-red-500">.com</span></p>
          <p className="mt-1 text-sm font-black uppercase tracking-[0.2em] text-blue-300">Bangladesh automotive marketplace</p>
          <p className="mt-3 max-w-md text-sm font-medium text-slate-400">MVP with local persistence. Replace localStorage with an API when the backend is ready.</p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm font-bold text-slate-300">
          {navItems.slice(1, 7).map((item) => <button key={item.path} onClick={() => go(item.path)} className="hover:text-white">{item.label}</button>)}
        </div>
      </div>
    </footer>
  );
}
