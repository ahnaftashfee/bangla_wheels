import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { classNames } from "../lib/marketplace";

export function Badge({ children, variant = "default", className = "" }) {
  const styles = {
    default: "bg-slate-100 text-slate-700 ring-slate-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    yellow: "bg-amber-50 text-amber-700 ring-amber-100",
    dark: "bg-slate-950 text-white ring-white/10",
    purple: "bg-violet-50 text-violet-700 ring-violet-100",
  };

  return (
    <span className={classNames("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ring-1", styles[variant], className)}>
      {children}
    </span>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20",
    secondary: "bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50",
    blue: "bg-blue-700 text-white hover:bg-blue-800 shadow-lg shadow-blue-700/20",
    dark: "bg-slate-950 text-white hover:bg-slate-800",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
    subtle: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  };

  return (
    <button
      className={classNames(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>}
      {children}
    </label>
  );
}

export function TextInput({ label, className = "", ...props }) {
  return (
    <Field label={label}>
      <input
        className={classNames(
          "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100",
          className,
        )}
        {...props}
      />
    </Field>
  );
}

export function SelectField({ label, value, onChange, children, className = "" }) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={onChange}
        className={classNames(
          "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100",
          className,
        )}
      >
        {children}
      </select>
    </Field>
  );
}

export function TextArea({ label, className = "", ...props }) {
  return (
    <Field label={label}>
      <textarea
        className={classNames(
          "min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100",
          className,
        )}
        {...props}
      />
    </Field>
  );
}

export function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(onClose, 2800);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed bottom-5 right-5 z-[120] max-w-sm rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-2xl ring-1 ring-white/10"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function StatCard({ label, value, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    green: "bg-emerald-50 text-emerald-700",
    yellow: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div className={classNames("flex h-11 w-11 items-center justify-center rounded-lg", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <ChevronRight className="h-5 w-5 text-slate-300" />
      </div>
      <p className="mt-5 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-500">{label}</p>
    </div>
  );
}

export function AdminPanel({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

export function AdminQueue({ title, items, empty, children }) {
  return (
    <div>
      <h3 className="mb-3 font-black">{title}</h3>
      <div className="grid gap-3">
        {items.length === 0 && <p className="rounded-xl bg-slate-50 p-5 text-sm font-bold text-slate-500">{empty}</p>}
        {items.map(children)}
      </div>
    </div>
  );
}
