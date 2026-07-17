"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  AlertCircle,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bell,
  BookOpen,
  Calculator,
  Camera,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  Filter,
  Gavel,
  Globe2,
  Heart,
  Home,
  LayoutDashboard,
  LockKeyhole,
  MapPin,
  Menu,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Trash2,
  Upload,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { useLocaleController } from "./RootProviders";
import { bodies, cities, featureGroups, fuels, inspectionSections, legalCopy, makes, transmissions } from "./platformSeed";
import { createPrototypeServices } from "../services/mockServices";
import { authConfigured, supabaseBrowser } from "../lib/supabaseBrowser";
import { backdropMotion, drawerMotion, itemMotion, modalMotion, motionSpring, pageMotion, panelMotion, popoverMotion, toastMotion } from "./motion";

const storageKey = "banglawheel:prototype:v2";

function formatBDT(amount) {
  const value = Math.round(Number(amount));
  if (!Number.isFinite(value)) return "0 BDT";
  return `${value.toLocaleString("en-US")} BDT`;
}

function dateShort(value) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function numberFrom(value) {
  return Number(String(value || "").replace(/[^\d]/g, "")) || 0;
}

function approvedOnly(listings = []) {
  return listings.filter((listing) => listing.status === "approved");
}

const initialPrototypeState = {
  profile: {
    id: "guest",
    name: "BanglaWheel User",
    phone: "",
    email: "",
    role: "Guest",
    language: "en",
    budgetMin: 0,
    budgetMax: 999999999,
    division: "Dhaka",
    verified: false,
  },
  listings: [],
  dealers: [],
  garages: [],
  auctions: [],
  warranties: [],
  financePartners: [],
  articles: [],
  enquiries: [],
  alerts: [],
  kycRequests: [],
  inspections: [],
  notifications: [],
  users: [],
  saved: [],
  compare: [],
  cookieOk: false,
  contactListing: null,
  authOpen: false,
  authUser: null,
  authReady: false,
  authPending: false,
  pendingAction: "",
  toast: "",
};

function mutationKey(type, payload = {}) {
  if (type === "updateItem") return `${type}:${payload.collection}:${payload.id}`;
  return `${type}:${payload.id || payload.profileId || payload.listingId || ""}`;
}

function useBackendPrototype() {
  const [state, setState] = useState(initialPrototypeState);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);
  const loadedSessionToken = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    let subscription;
    async function loadState(authSession = null) {
      const sessionToken = authSession?.access_token || "guest";
      if (loadedSessionToken.current === sessionToken) return;
      loadedSessionToken.current = sessionToken;
      try {
        const headers = authSession?.access_token ? { Authorization: `Bearer ${authSession.access_token}` } : {};
        const response = await fetch("/api/state", { cache: "no-store", signal: controller.signal, headers });
        if (!response.ok) throw new Error("Unable to load backend state.");
        const data = await response.json();
        const cookieOk = window.localStorage.getItem(storageKey) === "accepted";
        setState((current) => ({
          ...initialPrototypeState,
          ...data,
          cookieOk,
          contactListing: null,
          authOpen: current.authOpen,
          authUser: authSession?.user || null,
          authReady: true,
          authPending: current.authPending,
          pendingAction: current.pendingAction,
          toast: current.toast,
        }));
      } catch (error) {
        if (loadedSessionToken.current === sessionToken) loadedSessionToken.current = null;
        if (error.name !== "AbortError") {
          setState((current) => ({ ...current, toast: "Backend unavailable. Using starter data for this session." }));
        }
      } finally {
        setReady(true);
      }
    }
    async function startAuth() {
      if (!authConfigured || !supabaseBrowser) {
        setState((current) => ({ ...current, authReady: true }));
        await loadState(null);
        return;
      }
      const { data } = await supabaseBrowser.auth.getSession();
      setSession(data.session || null);
      await loadState(data.session || null);
      subscription = supabaseBrowser.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession || null);
        loadState(nextSession || null);
      })?.data?.subscription;
    }
    startAuth();
    return () => {
      controller.abort();
      subscription?.unsubscribe();
    };
  }, []);

  const setUi = (patchValue) => setState((current) => ({ ...current, ...(typeof patchValue === "function" ? patchValue(current) : patchValue) }));

  const mutate = async (type, payload = {}, mergeUi = {}) => {
    const pendingAction = mutationKey(type, payload);
    setState((current) => ({ ...current, pendingAction }));
    try {
      const response = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ type, payload }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save changes.");
      setState((current) => ({
        ...initialPrototypeState,
        ...result.state,
        cookieOk: current.cookieOk,
        contactListing: current.contactListing,
        authOpen: current.authOpen,
        authUser: current.authUser,
        authReady: current.authReady,
        authPending: current.authPending,
        pendingAction: "",
        toast: result.message || current.toast,
        ...(typeof mergeUi === "function" ? mergeUi(current, result.state) : mergeUi),
      }));
      return result.state;
    } catch (error) {
      setState((current) => ({ ...current, pendingAction: "", toast: error.message || "Unable to save changes." }));
      return null;
    }
  };

  const signIn = async ({ email, password }) => {
    if (!authConfigured || !supabaseBrowser) {
      setUi({ toast: "Supabase auth is not configured yet." });
      return;
    }
    setUi({ authPending: true });
    const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
    if (error) setUi({ authPending: false, toast: error.message });
    else setUi({ authOpen: false, authPending: false, toast: "Signed in." });
  };

  const signUp = async ({ email, password, name }) => {
    if (!authConfigured || !supabaseBrowser) {
      setUi({ toast: "Supabase auth is not configured yet." });
      return;
    }
    setUi({ authPending: true });
    const { error } = await supabaseBrowser.auth.signUp({ email, password, options: { data: { name } } });
    if (error) setUi({ authPending: false, toast: error.message });
    else setUi({ authOpen: false, authPending: false, toast: "Account created. Check your email if confirmation is enabled." });
  };

  const signOut = async () => {
    await supabaseBrowser?.auth.signOut();
    setUi({ authOpen: false, toast: "Signed out." });
  };

  return [state, { ready, setUi, mutate, signIn, signUp, signOut }];
}

function Button({ children, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20",
    blue: "bg-blue-700 text-white hover:bg-blue-800 shadow-lg shadow-blue-700/20",
    dark: "bg-slate-950 text-white hover:bg-slate-800",
    secondary: "bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50",
    subtle: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20",
  };
  return <button className={classNames("motion-control inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60", styles[variant], className)} {...props}>{children}</button>;
}

function Badge({ children, variant = "default", className = "" }) {
  const styles = {
    default: "bg-slate-100 text-slate-700 ring-slate-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    yellow: "bg-amber-50 text-amber-700 ring-amber-100",
    purple: "bg-violet-50 text-violet-700 ring-violet-100",
    dark: "bg-slate-950 text-white ring-white/10",
  };
  return <span className={classNames("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ring-1", styles[variant], className)}>{children}</span>;
}

function Field({ label, children }) {
  return <label className="block">{label && <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>}{children}</label>;
}

function TextInput({ label, className = "", ...props }) {
  return <Field label={label}><input className={classNames("motion-field h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100", className)} {...props} /></Field>;
}

function SelectField({ label, children, className = "", ...props }) {
  return <Field label={label}><select className={classNames("motion-field h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100", className)} {...props}>{children}</select></Field>;
}

function TextArea({ label, className = "", ...props }) {
  return <Field label={label}><textarea className={classNames("motion-field min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100", className)} {...props} /></Field>;
}

function StatCard({ label, value, icon: Icon, tone = "blue" }) {
  const tones = { blue: "bg-blue-50 text-blue-700", red: "bg-red-50 text-red-700", green: "bg-emerald-50 text-emerald-700", yellow: "bg-amber-50 text-amber-700", purple: "bg-violet-50 text-violet-700" };
  return <div className="motion-card rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-center justify-between"><div className={classNames("flex h-11 w-11 items-center justify-center rounded-lg", tones[tone])}><Icon className="h-5 w-5" /></div><ChevronRight className="h-5 w-5 text-slate-300" /></div><p className="mt-5 text-3xl font-black text-slate-950">{value}</p><p className="mt-1 text-sm font-bold text-slate-500">{label}</p></div>;
}

const primaryNavItems = [
  ["Home", "/", Home],
  ["Cars", "/cars", Search],
  ["Sell", "/sell", Car],
  ["Dealers", "/dealers", Store],
];

const exploreGroups = [
  ["Buyer Tools", [
    ["Compare Cars", "/compare", BarChart3],
    ["Book Inspection", "/inspect", ClipboardCheck],
    ["Financing", "/financing", Banknote],
  ]],
  ["Account", [
    ["Account Dashboard", "/account", UserRound],
    ["My Listings", "/account/listings", Car],
    ["Admin Console", "/admin", LayoutDashboard],
  ]],
];

export function BanglaWheelApp() {
  const t = useTranslations();
  const initialPathname = usePathname();
  const initialParams = useSearchParams();
  const [location, setLocation] = useState(() => ({ pathname: initialPathname, search: initialParams.toString() }));
  const pathname = location.pathname;
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const { locale, setLocale } = useLocaleController();
  const [state, backend] = useBackendPrototype();
  const [mobileOpen, setMobileOpen] = useState(false);
  const services = useMemo(() => createPrototypeServices(state), [state]);

  useEffect(() => {
    const syncLocation = () => setLocation({ pathname: window.location.pathname, search: window.location.search.slice(1) });
    window.addEventListener("popstate", syncLocation);
    return () => window.removeEventListener("popstate", syncLocation);
  }, []);

  const go = (path) => {
    const nextUrl = new URL(path, window.location.href);
    if (nextUrl.origin !== window.location.origin) {
      window.location.assign(nextUrl.href);
      return;
    }
    const nextLocation = { pathname: nextUrl.pathname, search: nextUrl.search.slice(1) };
    if (nextLocation.pathname !== pathname || nextLocation.search !== location.search) {
      window.history.pushState(null, "", `${nextLocation.pathname}${nextUrl.search}${nextUrl.hash}`);
      setLocation(nextLocation);
    }
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const listings = state.listings.filter((item) => item.status === "approved");
  const currentListing = listings.find((item) => pathname === `/cars/${item.slug}` || pathname === `/cars/${item.id}`);

  const requireLogin = (callback, message) => (...args) => {
    if (state.authUser) return callback(...args);
    backend.setUi({ authOpen: true, toast: message });
    return Promise.resolve(null);
  };

  const actions = {
    go,
    services,
    isPending: (type, id = "", collection = "") => state.pendingAction === (type === "updateItem" ? `${type}:${collection}:${id}` : `${type}:${id}`),
    notify: (message) => backend.setUi({ toast: message }),
    toggleSave: requireLogin((id) => backend.mutate("toggleSave", { id }), "Login to save cars to your account."),
    toggleCompare: requireLogin((id) => backend.mutate("toggleCompare", { id }), "Login to build and keep a car comparison."),
    openContact: (listing) => listing && !state.authUser ? backend.setUi({ authOpen: true, toast: "Login to contact this seller." }) : backend.setUi({ contactListing: listing }),
    submitLead: requireLogin((lead) => backend.mutate("submitLead", { lead }, { contactListing: null }), "Login before sending an enquiry."),
    createAlert: requireLogin((alert) => backend.mutate("createAlert", { alert }), "Login to create a saved-search alert."),
    addListing: (listing) => backend.mutate("addListing", { listing }),
    addKyc: requireLogin((kyc) => backend.mutate("addKyc", { kyc }), "Login before submitting seller verification."),
    addInspection: requireLogin((inspection) => backend.mutate("addInspection", { inspection }), "Login before requesting an inspection."),
    // Auction launch is deferred. Restore bidding mutations when live bidding returns.
    // addBid: (auctionId, amount, maxAutoBid = "") => backend.mutate("addBid", { auctionId, amount, maxAutoBid }),
    addClaim: requireLogin((claim) => backend.mutate("addClaim", { claim }), "Login before submitting a warranty claim."),
    updateItem: (collection, id, patchValue) => backend.mutate("updateItem", { collection, id, patchValue }),
    updateRole: (profileId, role) => backend.mutate("updateRole", { profileId, role }),
    updateProfile: (patchValue) => backend.mutate("updateProfile", { patchValue }),
    deleteListing: (id) => backend.mutate("deleteListing", { id }),
    shareListing: async (listing) => {
      const url = `${window.location.origin}/cars/${listing.slug}`;
      try {
        if (navigator.share) await navigator.share({ title: listing.title, text: `${listing.title} on BanglaWheel`, url });
        else await navigator.clipboard.writeText(url);
        backend.setUi({ toast: navigator.share ? "Listing shared." : "Listing link copied." });
      } catch (error) {
        if (error?.name !== "AbortError") backend.setUi({ toast: "Unable to share this listing." });
      }
    },
    setCookieOk: () => {
      window.localStorage.setItem(storageKey, "accepted");
      backend.setUi({ cookieOk: true });
    },
    reset: () => backend.mutate("reset"),
    openAuth: () => backend.setUi({ authOpen: true }),
    closeAuth: () => backend.setUi({ authOpen: false }),
    signIn: backend.signIn,
    signUp: backend.signUp,
    signOut: backend.signOut,
  };

  const role = state.profile.role || "guest";
  const signedIn = Boolean(state.authUser);
  const authHydrating = !backend.ready || !state.authReady;
  const needsAccount = pathname.startsWith("/account");
  const needsSeller = pathname === "/sell";
  const needsAdmin = pathname.startsWith("/admin");
  let page = <HomePage state={state} actions={actions} t={t} />;
  if (pathname === "/cars") page = <CarsPage state={state} actions={actions} params={params} />;
  else if (currentListing) page = <ListingDetailPage listing={currentListing} state={state} actions={actions} />;
  else if (needsSeller) page = authHydrating ? <AuthLoading /> : signedIn && ["seller", "dealer", "admin"].includes(role) ? <SellWizard state={state} actions={actions} /> : <AuthRequired title="Seller login required" text="Sign in with a seller, dealer, or admin account to post a vehicle." actions={actions} />;
  else if (pathname === "/dealers") page = <DealersPage state={state} actions={actions} />;
  else if (pathname.startsWith("/dealers/")) page = <DealerDetailPage state={state} actions={actions} slug={pathname.split("/").pop()} />;
  // Auction launch is deferred. Restore these routes when live bidding returns.
  // else if (pathname === "/auction") page = <AuctionListPageDeferred state={state} actions={actions} />;
  // else if (pathname.startsWith("/auction/")) page = <AuctionDetailPageDeferred state={state} actions={actions} id={pathname.split("/").pop()} />;
  else if (pathname === "/certified") page = <CertifiedPage state={state} actions={actions} />;
  else if (pathname === "/garages") page = <GaragesPage state={state} actions={actions} />;
  else if (pathname === "/inspect") page = <InspectPage state={state} actions={actions} params={params} />;
  else if (pathname === "/warranty") page = <WarrantyPage state={state} actions={actions} />;
  else if (pathname === "/financing") page = <FinancingPage state={state} actions={actions} />;
  else if (pathname === "/paperwork") page = <PaperworkPage />;
  else if (pathname === "/learn") page = <LearnPage state={state} actions={actions} locale={locale} />;
  else if (pathname.startsWith("/learn/")) page = <ArticlePage state={state} actions={actions} slug={pathname.split("/").pop()} locale={locale} />;
  else if (pathname === "/compare") page = <ComparePage state={state} actions={actions} />;
  else if (needsAccount) page = authHydrating ? <AuthLoading /> : signedIn ? <AccountPage state={state} actions={actions} path={pathname} locale={locale} setLocale={setLocale} /> : <AuthRequired title="Account login required" text="Sign in to manage saved cars, listings, KYC, alerts, and warranty claims." actions={actions} />;
  else if (needsAdmin) page = authHydrating ? <AuthLoading /> : role === "admin" ? <AdminPage state={state} actions={actions} path={pathname} /> : <AuthRequired title="Admin access required" text="This console is restricted to BanglaWheel admin accounts." actions={actions} />;
  else if (["/privacy-policy", "/terms-of-service", "/data-deletion", "/about"].includes(pathname)) page = <LegalPage slug={pathname.slice(1)} actions={actions} />;
  else if (pathname === "/parts") page = <ExtensionPage />;

  return (
    <MotionConfig reducedMotion="user" transition={motionSpring.responsive}>
    <div className="min-h-screen bg-[#f4f7fb]">
      <Header t={t} state={state} actions={actions} pathname={pathname} go={go} locale={locale} setLocale={setLocale} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      {currentListing && <VehicleJsonLd listing={currentListing} />}
      <motion.div
        key={pathname}
        initial={pageMotion.initial}
        animate={pageMotion.animate}
        transition={pageMotion.transition}
      >
        {page}
      </motion.div>
      <AnimatePresence>{state.compare.length > 0 && <FloatingCompare key="floating-compare" state={state} actions={actions} />}</AnimatePresence>
      <Footer go={go} />
      <ContactModal state={state} actions={actions} />
      <AuthModal state={state} actions={actions} />
      <Toast message={state.toast} onClose={() => backend.setUi({ toast: "" })} />
      <AnimatePresence>{!state.cookieOk && <CookieBanner key="cookie-banner" onAccept={actions.setCookieOk} />}</AnimatePresence>
    </div>
    </MotionConfig>
  );
}

function Header({ t, state, actions, pathname, go, locale, setLocale, mobileOpen, setMobileOpen }) {
  const [exploreOpen, setExploreOpen] = useState(false);
  const isAdmin = state.profile.role === "admin";
  const active = (path) => path === "/" ? pathname === "/" : pathname.startsWith(path);
  const jump = (path) => {
    setExploreOpen(false);
    go(path);
  };
  return (
    <>
      <div className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-4 py-2 text-xs font-bold sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p className="flex items-center gap-2"><Bell className="h-3.5 w-3.5 text-red-400" /> Trust-first marketplace: KYC, inspection, warranty, finance, BRTA, i18n</p>
          <div className="flex flex-wrap gap-4 text-slate-300">
            <button onClick={() => go("/sell")} className="hover:text-white">Post an Ad</button>
            {state.authUser && <button onClick={() => go("/account/listings")} className="hover:text-white">My Listings</button>}
          </div>
        </div>
      </div>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button onClick={() => go("/")} className="flex items-center gap-3 text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/25"><Car className="h-6 w-6" /></div>
            <div>
              <p className="text-2xl font-black tracking-tight text-slate-950">{t("brand")}<span className="text-red-600">.com</span></p>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">{t("tagline")}</p>
            </div>
          </button>
          <nav className="hidden items-center gap-1 xl:flex">
            {primaryNavItems.map(([label, path]) => (
              <button key={path} onClick={() => go(path)} className={classNames("motion-control rounded-lg px-3 py-2 text-sm font-black", active(path) ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100 hover:text-red-600")}>{t(`nav.${label.toLowerCase()}`)}</button>
            ))}
            <div className="relative">
              <button onClick={() => setExploreOpen((value) => !value)} aria-expanded={exploreOpen} className={classNames("motion-control inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-black", exploreOpen ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100 hover:text-red-600")}>Explore <motion.span animate={{ rotate: exploreOpen ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown className="h-4 w-4" /></motion.span></button>
              <AnimatePresence>
              {exploreOpen && (
                <motion.div {...popoverMotion} className="absolute right-0 top-12 w-[460px] origin-top-right rounded-2xl bg-white p-4 text-left shadow-2xl ring-1 ring-slate-200">
                  <div className="grid grid-cols-2 gap-4">
                    {exploreGroups.map(([group, links]) => (
                      <div key={group}>
                        <p className="px-2 text-xs font-black uppercase tracking-wide text-slate-400">{group}</p>
                        <div className="mt-2 grid gap-1">
                          {links.filter(([label]) => isAdmin || label !== "Admin Console").map(([label, path, Icon]) => (
                            <button key={path} onClick={() => jump(path)} className="motion-control group flex items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-blue-50">
                              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-blue-700 group-hover:bg-blue-700 group-hover:text-white"><Icon className="h-4 w-4" /></span>
                              <span className="text-sm font-black text-slate-800">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            <button onClick={() => setLocale(locale === "en" ? "bn" : "en")} className="inline-flex h-10 items-center gap-1 rounded-lg bg-slate-100 p-1 text-xs font-black text-slate-600">
              <Globe2 className="ml-2 h-4 w-4" /><span className={classNames("rounded-md px-2 py-1", locale === "en" && "bg-white text-blue-700 shadow")}>EN</span><span className={classNames("rounded-md px-2 py-1", locale === "bn" && "bg-white text-blue-700 shadow")}>বাংলা</span>
            </button>
            <Button variant={state.compare.length ? "blue" : "secondary"} onClick={() => go("/compare")}><BarChart3 className="h-4 w-4" /> {state.compare.length}/3</Button>
            {isAdmin && <Button variant={active("/admin") ? "dark" : "secondary"} onClick={() => go("/admin")}><LayoutDashboard className="h-4 w-4" /> Admin</Button>}
            {state.authUser ? (
              <>
                <Button variant="secondary" onClick={() => go("/account")}><UserRound className="h-4 w-4" /> {state.profile.name.split(" ")[0]}</Button>
                <Button variant="ghost" onClick={actions.signOut}>Logout</Button>
              </>
            ) : (
              <Button variant="secondary" onClick={actions.openAuth}><UserRound className="h-4 w-4" /> Login</Button>
            )}
            <Button onClick={() => go("/sell")}><Car className="h-4 w-4" /> Post Ad</Button>
          </div>
          <button className="motion-control rounded-lg p-2 hover:bg-slate-100 xl:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu" aria-expanded={mobileOpen}><AnimatePresence initial={false} mode="wait"><motion.span key={mobileOpen ? "close" : "menu"} initial={{ opacity: 0, rotate: -8, scale: 0.94 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 8, scale: 0.94 }} transition={{ duration: 0.18 }} className="block">{mobileOpen ? <X /> : <Menu />}</motion.span></AnimatePresence></button>
        </div>
        <AnimatePresence>
        {mobileOpen && (
          <motion.div {...drawerMotion} className="absolute left-0 right-0 top-full max-h-[calc(100vh-88px)] overflow-y-auto border-t border-slate-100 bg-white px-4 py-4 shadow-xl xl:hidden">
            <div className="grid gap-2 sm:grid-cols-2">
              {primaryNavItems.map(([label, path, Icon]) => <button key={path} onClick={() => go(path)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-black text-slate-700 hover:bg-slate-100"><Icon className="h-4 w-4 text-blue-700" /> {t(`nav.${label.toLowerCase()}`)}</button>)}
              <button onClick={() => go("/compare")} className="flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-3 text-left text-sm font-black text-blue-800"><BarChart3 className="h-4 w-4" /> Compare {state.compare.length}/3</button>
              {state.authUser ? <button onClick={actions.signOut} className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-black text-slate-700 hover:bg-slate-100"><UserRound className="h-4 w-4 text-blue-700" /> Logout</button> : <button onClick={actions.openAuth} className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-black text-slate-700 hover:bg-slate-100"><UserRound className="h-4 w-4 text-blue-700" /> Login</button>}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {exploreGroups.map(([group, links]) => (
                <div key={group} className="rounded-xl bg-slate-50 p-3">
                  <p className="px-1 text-xs font-black uppercase tracking-wide text-slate-400">{group}</p>
                  <div className="mt-2 grid gap-1">
                    {links.filter(([label]) => isAdmin || label !== "Admin Console").map(([label, path, Icon]) => <button key={path} onClick={() => go(path)} className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-black text-slate-700 hover:bg-white"><Icon className="h-4 w-4 text-blue-700" /> {label}</button>)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </header>
    </>
  );
}

function AuthRequired({ title, text, actions }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><LockKeyhole className="h-7 w-7" /></div>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">{title}</h1>
        <p className="mx-auto mt-3 max-w-xl font-semibold leading-7 text-slate-600">{text}</p>
        <Button className="mt-6" variant="blue" onClick={actions.openAuth}><UserRound className="h-4 w-4" /> Login or create account</Button>
      </div>
    </main>
  );
}

function AuthLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-4">
          <div className="motion-skeleton h-12 w-12 rounded-xl bg-blue-100" />
          <div className="min-w-0 flex-1">
            <div className="motion-skeleton h-4 w-36 rounded-full bg-slate-200" />
            <div className="motion-skeleton mt-3 h-8 w-64 max-w-full rounded-lg bg-slate-100" />
          </div>
        </div>
        <div className="mt-8 grid gap-3">
          <div className="motion-skeleton h-16 rounded-xl bg-slate-50" />
          <div className="motion-skeleton h-16 rounded-xl bg-slate-50" />
          <div className="motion-skeleton h-16 rounded-xl bg-slate-50" />
        </div>
      </div>
    </main>
  );
}

function AuthModal({ state, actions }) {
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  useEffect(() => {
    if (!state.authOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !state.authPending) actions.closeAuth();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [actions, state.authOpen, state.authPending]);

  const submit = (event) => {
    event.preventDefault();
    if (mode === "signup") actions.signUp(form);
    else actions.signIn(form);
  };

  return (
    <AnimatePresence>
    {state.authOpen && (
    <motion.div {...backdropMotion} className="fixed inset-0 z-[120] bg-slate-950/70 p-4 backdrop-blur-sm" onClick={actions.closeAuth}>
      <motion.form {...modalMotion} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" onSubmit={submit} className="mx-auto mt-16 max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="blue"><ShieldCheck className="h-3.5 w-3.5" /> Secure account</Badge>
            <h2 id="auth-modal-title" className="mt-3 text-2xl font-black text-slate-950">{mode === "signup" ? "Create account" : "Login to BanglaWheel"}</h2>
          </div>
          <button type="button" onClick={actions.closeAuth} className="motion-control rounded-full p-2 hover:bg-slate-100" aria-label="Close login"><X className="h-5 w-5" /></button>
        </div>
        {!authConfigured && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm font-black text-amber-800">Supabase auth is missing the public key in env.</p>}
        <div className="mt-5 grid gap-4">
          <AnimatePresence initial={false}>{mode === "signup" && <motion.div {...panelMotion}><TextInput label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></motion.div>}</AnimatePresence>
          <TextInput label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <TextInput label="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={6} />
        </div>
        <Button className="mt-5 w-full" type="submit" variant="blue" disabled={!authConfigured || state.authPending} aria-busy={state.authPending}>{state.authPending ? <><RefreshCw className="h-4 w-4 animate-spin" /> Please wait...</> : mode === "signup" ? "Create account" : "Login"}</Button>
        <button type="button" onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="mt-4 w-full text-sm font-black text-blue-700 hover:text-blue-900">
          {mode === "signup" ? "Already have an account? Login" : "New here? Create account"}
        </button>
      </motion.form>
    </motion.div>
    )}
    </AnimatePresence>
  );
}

function HomePage({ state, actions, t }) {
  const [query, setQuery] = useState("");
  const publicListings = approvedOnly(state.listings);
  const recommended = publicListings.filter((item) => item.price >= state.profile.budgetMin && item.price <= state.profile.budgetMax).slice(0, 3);
  const near = [...publicListings].sort((a, b) => Number(a.city !== state.profile.division) - Number(b.city !== state.profile.division)).slice(0, 3);
  const run = (event) => {
    event.preventDefault();
    actions.go(`/cars?q=${encodeURIComponent(query)}`);
  };
  return (
    <main>
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950/55" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8 lg:py-20">
          <div>
            <Badge variant="dark"><ShieldCheck className="h-3.5 w-3.5 text-red-400" /> Version 1.1 complete prototype</Badge>
            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight text-white sm:text-6xl">{t("home.headline")}</h1>
            <p className="mt-5 max-w-3xl text-lg font-medium leading-8 text-blue-100">{t("home.subhead")}</p>
            <form onSubmit={run} className="mt-8 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-white/10">
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="relative"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("home.search")} className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" /></div>
                <Button className="h-12" type="submit"><Search className="h-4 w-4" /> {t("actions.search")}</Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500">{["Toyota Premio", "Hybrid under 3,000,000 BDT", "Certified in Dhaka", "Warranty covered"].map((pill) => <button key={pill} type="button" onClick={() => actions.go(`/cars?q=${encodeURIComponent(pill)}`)} className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200 hover:bg-blue-50 hover:text-blue-700">{pill}</button>)}</div>
            </form>
          </div>
          <div className="hidden lg:block">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
              <div className="rounded-xl bg-white p-4">
                <div className="flex items-center justify-between"><div><p className="text-sm font-black text-slate-500">Live trust pulse</p><p className="mt-1 text-3xl font-black text-slate-950">{publicListings.length} cars</p></div><Badge variant="green"><Sparkles className="h-3.5 w-3.5" /> Complete</Badge></div>
                <div className="mt-5 grid gap-3">{publicListings.slice(0, 3).map((listing) => <button key={listing.id} onClick={() => actions.go(`/cars/${listing.slug}`)} className="flex gap-3 rounded-xl bg-slate-50 p-3 text-left ring-1 ring-slate-100 hover:bg-blue-50"><img src={listing.media[0]} alt="" className="h-20 w-24 rounded-lg object-cover" /><div className="min-w-0"><p className="line-clamp-1 font-black text-slate-950">{listing.title}</p><p className="mt-1 text-sm font-bold text-red-600">{formatBDT(listing.price)}</p><p className="mt-1 text-xs font-bold text-slate-500">{listing.city} - {listing.mileage.toLocaleString()} km</p></div></button>)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-5">
          <StatCard label="Verified listings" value={publicListings.filter((x) => x.verifiedSeller).length} icon={ShieldCheck} />
          {/* Auction launch is deferred. Restore this live auction stat when live bidding returns. */}
          {/* <StatCard label="Live auctions" value={state.auctions.filter((x) => x.status === "live").length} icon={Gavel} tone="yellow" /> */}
          <StatCard label="Garage partners" value={state.garages.length} icon={ClipboardCheck} tone="green" />
          <StatCard label="Warranty cars" value={state.warranties.length} icon={WalletCards} tone="red" />
          <StatCard label="Unread alerts" value={state.notifications.filter((x) => x.status === "unread").length} icon={Bell} tone="purple" />
        </div>
      </section>
      <ListingRail title={t("home.recommended")} listings={recommended} state={state} actions={actions} />
      <ListingRail title={t("home.nearby")} listings={near} state={state} actions={actions} />
    </main>
  );
}

function ListingRail({ title, listings, state, actions }) {
  return <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8"><div className="mb-5 flex items-end justify-between"><h2 className="text-2xl font-black text-slate-950">{title}</h2><Button variant="secondary" onClick={() => actions.go("/cars")}>View all</Button></div><div className="grid gap-6 md:grid-cols-3">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} state={state} actions={actions} />)}</div></section>;
}

function ListingCard({ listing, state, actions, compact = false }) {
  const saved = state.saved.includes(listing.id);
  const compared = state.compare.includes(listing.id);
  return (
    <motion.article layout="position" {...itemMotion} className={classNames("motion-card group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 hover:shadow-xl", compact && "grid md:grid-cols-[240px_1fr]")}>
      <button onClick={() => actions.go(`/cars/${listing.slug}`)} className={classNames("relative block w-full overflow-hidden bg-slate-200 text-left", compact ? "h-56 md:h-full" : "h-52")}>
        <img src={listing.media[0]} alt={listing.title} className="h-full w-full object-cover transition-transform duration-[380ms] ease-out group-hover:scale-[1.02]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">{listing.featured && <Badge variant="yellow"><Star className="h-3.5 w-3.5" /> Featured</Badge>}{listing.certified && <Badge variant="green"><BadgeCheck className="h-3.5 w-3.5" /> Certified</Badge>}{/* Auction launch is deferred. Restore this bid badge when live bidding returns. */}{/* {listing.auctionEnabled && <Badge variant="purple"><Gavel className="h-3.5 w-3.5" /> Bid</Badge>} */}</div>
        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-slate-950/75 px-3 py-1 text-xs font-bold text-white backdrop-blur"><Camera className="h-3.5 w-3.5" /> {listing.media.length + 8} photos</div>
        <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-slate-700">{formatBDT(listing.price)}</div>
      </button>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3"><Badge variant={listing.verifiedSeller ? "green" : "yellow"}>{listing.verifiedSeller ? <ShieldCheck className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}{listing.verifiedSeller ? "Verified seller" : "KYC pending"}</Badge><span className="text-xs font-bold text-slate-400">{listing.views.toLocaleString()} views</span></div>
        <button onClick={() => actions.go(`/cars/${listing.slug}`)} className="mt-3 block text-left"><h3 className="line-clamp-1 text-lg font-black text-slate-950">{listing.title}</h3><p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-500"><MapPin className="h-4 w-4 text-red-500" /> {listing.area}, {listing.city}</p></button>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-semibold text-slate-600"><div className="rounded-lg bg-slate-50 p-3"><Car className="mb-1 h-4 w-4 text-blue-700" /> {listing.year}</div><div className="rounded-lg bg-slate-50 p-3"><Settings className="mb-1 h-4 w-4 text-blue-700" /> {listing.transmission}</div><div className="rounded-lg bg-slate-50 p-3"><Sparkles className="mb-1 h-4 w-4 text-blue-700" /> {listing.fuel}</div><div className="rounded-lg bg-slate-50 p-3"><MapPin className="mb-1 h-4 w-4 text-blue-700" /> 8 km away</div></div>
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4"><Button variant={saved ? "primary" : "secondary"} className="px-2" disabled={actions.isPending("toggleSave", listing.id)} onClick={() => actions.toggleSave(listing.id)} aria-label={saved ? "Remove from saved cars" : "Save car"} title={saved ? "Remove from saved cars" : "Save car"}><Heart className={classNames("h-4 w-4", saved && "fill-white")} /></Button><Button variant={compared ? "blue" : "secondary"} className="px-2" disabled={actions.isPending("toggleCompare", listing.id)} onClick={() => actions.toggleCompare(listing.id)} aria-label={compared ? "Remove from comparison" : "Add to comparison"} title={compared ? "Remove from comparison" : "Add to comparison"}><BarChart3 className="h-4 w-4" /></Button><Button className="px-2" variant="blue" onClick={() => actions.openContact(listing)} aria-label="Contact seller" title="Contact seller"><Phone className="h-4 w-4" /></Button></div>
      </div>
    </motion.article>
  );
}

function FloatingCompare({ state, actions }) {
  const selected = state.listings.filter((listing) => state.compare.includes(listing.id)).slice(0, 3);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={motionSpring.responsive}
      className="fixed bottom-5 right-5 z-[90] hidden w-[360px] rounded-2xl bg-slate-950 p-3 text-white shadow-2xl ring-1 ring-white/10 lg:block"
    >
      <button onClick={() => actions.go("/compare")} className="flex w-full items-center justify-between gap-3 text-left">
        <div>
          <p className="text-sm font-black">Compare selected cars</p>
          <p className="text-xs font-bold text-slate-300">{state.compare.length}/3 selected</p>
        </div>
        <Badge variant="red"><BarChart3 className="h-3.5 w-3.5" /> Open</Badge>
      </button>
      <div className="mt-3 flex -space-x-3">
        {selected.map((listing) => <img key={listing.id} src={listing.media[0]} alt="" className="h-12 w-16 rounded-lg object-cover ring-2 ring-slate-950" />)}
      </div>
    </motion.div>
  );
}

function CarsPage({ state, actions, params }) {
  const [filters, setFilters] = useState({
    q: params.get("q") || "",
    make: "All",
    body: "All",
    city: "All",
    minPrice: "0",
    maxPrice: "10000000",
    minYear: "1995",
    maxMileage: "300000",
    certified: false,
    warranty: false,
    // Auction launch is deferred. Restore this filter state when live bidding returns.
    // auction: false,
  });
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");
  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const filtered = useMemo(() => {
    const q = filters.q.toLowerCase().trim();
    let result = approvedOnly(state.listings).filter((listing) => {
      const text = `${listing.title} ${listing.make} ${listing.model} ${listing.city} ${listing.body} ${listing.fuel} ${listing.sellerName}`.toLowerCase();
      return (!q || text.includes(q)) && (filters.make === "All" || listing.make === filters.make) && (filters.body === "All" || listing.body === filters.body) && (filters.city === "All" || listing.city === filters.city) && listing.price >= numberFrom(filters.minPrice) && listing.price <= numberFrom(filters.maxPrice) && listing.year >= Number(filters.minYear) && listing.mileage <= Number(filters.maxMileage) && (!filters.certified || listing.certified) && (!filters.warranty || listing.warrantyCovered);
    });
    if (sort === "low") result = result.sort((a, b) => a.price - b.price);
    if (sort === "high") result = result.sort((a, b) => b.price - a.price);
    if (sort === "mileage") result = result.sort((a, b) => a.mileage - b.mileage);
    if (sort === "views") result = result.sort((a, b) => b.views - a.views);
    if (sort === "distance") result = result.sort((a, b) => Number(a.city !== state.profile.division) - Number(b.city !== state.profile.division));
    if (sort === "newest") result = result.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
    return result;
  }, [filters, sort, state.listings, state.profile.division]);
  const activeChips = Object.entries(filters).filter(([key, value]) => value && value !== "All" && value !== false && !(key === "minPrice" && value === "0") && !(key === "maxPrice" && value === "10000000") && !(key === "minYear" && value === "1995") && !(key === "maxMileage" && value === "300000"));
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><Badge variant="blue"><Filter className="h-3.5 w-3.5" /> Search, filters, sort</Badge><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Used cars for sale in Bangladesh</h1><p className="mt-2 max-w-2xl font-medium text-slate-600">Autocomplete-ready search, active chips, range controls, list/grid view, recommendations, and saved alerts.</p></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => actions.createAlert({ name: filters.q || "Saved car search", filters, matches: filtered.length })}><Bell className="h-4 w-4" /> Create alert</Button><Button onClick={() => actions.go("/sell")}>Post ad</Button></div></div>
      <div className="grid min-w-0 gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="h-fit min-w-0 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="flex items-center gap-2 text-lg font-black"><Filter className="h-5 w-5 text-blue-700" /> Filters</h2>
          <div className="mt-5 grid gap-4">
            <TextInput label="Keyword" value={filters.q} onChange={(event) => setFilter("q", event.target.value)} list="search-options" placeholder="Allion, hybrid, Dhaka..." />
            <datalist id="search-options">{["Toyota Allion", "Honda Grace", "Hybrid", "Certified", "Warranty covered"].map((item) => <option key={item} value={item} />)}</datalist>
            <SelectField label="Make" value={filters.make} onChange={(event) => setFilter("make", event.target.value)}><option>All</option>{makes.map((item) => <option key={item}>{item}</option>)}</SelectField>
            <SelectField label="Body Type" value={filters.body} onChange={(event) => setFilter("body", event.target.value)}><option>All</option>{bodies.map((item) => <option key={item}>{item}</option>)}</SelectField>
            <SelectField label="Location" value={filters.city} onChange={(event) => setFilter("city", event.target.value)}><option>All</option>{cities.map((item) => <option key={item}>{item}</option>)}</SelectField>
            <div className="grid grid-cols-2 gap-3"><TextInput label="Min price" value={filters.minPrice} onChange={(event) => setFilter("minPrice", event.target.value)} /><TextInput label="Max price" value={filters.maxPrice} onChange={(event) => setFilter("maxPrice", event.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3"><TextInput label="Min year" value={filters.minYear} onChange={(event) => setFilter("minYear", event.target.value)} /><TextInput label="Max KM" value={filters.maxMileage} onChange={(event) => setFilter("maxMileage", event.target.value)} /></div>
            {[
              ["certified", "Certified"],
              ["warranty", "Warranty available"],
              // Auction launch is deferred. Restore this browse filter when live bidding returns.
              // ["auction", "Auction only"],
            ].map(([key, label]) => <label key={key} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-black text-slate-700"><input type="checkbox" checked={filters[key]} onChange={(event) => setFilter(key, event.target.checked)} /> {label}</label>)}
          </div>
        </aside>
        <section className="min-w-0">
          <div className="mb-4 rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="font-black text-slate-950">Showing {filtered.length} of {approvedOnly(state.listings).length} approved listings</p><p className="text-sm font-bold text-slate-500">Saved {state.saved.length} - Compare {state.compare.length}/3</p></div><div className="flex min-w-0 flex-wrap gap-2"><select value={sort} onChange={(event) => setSort(event.target.value)} className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black outline-none sm:flex-none sm:px-4"><option value="newest">Newest listed</option><option value="low">Price low-high</option><option value="high">Price high-low</option><option value="mileage">Mileage lowest</option><option value="views">Most viewed</option><option value="distance">Distance nearest first</option></select><Button variant={view === "grid" ? "blue" : "secondary"} onClick={() => setView("grid")}>Grid</Button><Button variant={view === "list" ? "blue" : "secondary"} onClick={() => setView("list")}>List</Button></div></div>
            <AnimatePresence initial={false}>{activeChips.length > 0 && <motion.div {...panelMotion} className="mt-4 flex flex-wrap gap-2">{activeChips.map(([key, value]) => <motion.button layout key={key} {...itemMotion} onClick={() => setFilter(key, typeof value === "boolean" ? false : "All")} className="motion-control rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-100">{key}: {String(value)} x</motion.button>)}</motion.div>}</AnimatePresence>
          </div>
          <motion.div layout className={classNames("grid gap-6", view === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}><AnimatePresence initial={false} mode="popLayout">{filtered.map((listing) => <ListingCard key={listing.id} listing={listing} state={state} actions={actions} compact={view === "list"} />)}</AnimatePresence></motion.div>
        </section>
      </div>
    </main>
  );
}

function ListingDetailPage({ listing, state, actions }) {
  const media = Array.isArray(listing.media) && listing.media.length ? listing.media : ["https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1200&auto=format&fit=crop"];
  const [gallery, setGallery] = useState({ listingId: listing.id, index: 0 });
  const activeImage = gallery.listingId === listing.id ? Math.min(gallery.index, media.length - 1) : 0;
  const moveImage = (direction) => {
    setGallery((current) => {
      const currentIndex = current.listingId === listing.id ? current.index : 0;
      return { listingId: listing.id, index: (currentIndex + direction + media.length) % media.length };
    });
  };
  const similar = approvedOnly(state.listings).filter((item) => item.id !== listing.id && (item.make === listing.make || item.city === listing.city)).slice(0, 3);
  // Auction launch is deferred. Restore this listing-level lookup when live bidding returns.
  // const auction = state.auctions.find((item) => item.listingId === listing.id);
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <button onClick={() => actions.go("/cars")} className="mb-5 text-sm font-black text-blue-700">Back to cars</button>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="relative h-[420px] bg-slate-200">
              <motion.img key={`${listing.id}-${activeImage}`} initial={{ opacity: 0.7, scale: 1.003 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.28 }} src={media[activeImage]} alt={listing.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">{listing.certified && <Badge variant="green"><ShieldCheck className="h-3.5 w-3.5" /> BanglaWheel Certified</Badge>}{listing.verifiedSeller && <Badge variant="blue"><BadgeCheck className="h-3.5 w-3.5" /> Verified Seller</Badge>}{listing.warrantyCovered && <Badge variant="red"><WalletCards className="h-3.5 w-3.5" /> Warranty Covered</Badge>}{listing.premium && <Badge variant="yellow"><Star className="h-3.5 w-3.5" /> Premium</Badge>}</div>
              {media.length > 1 && (
                <>
                  <button type="button" onClick={() => moveImage(-1)} className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-950 shadow-lg transition-transform duration-150 hover:bg-white active:-translate-y-1/2 active:scale-95" aria-label="Previous image"><ChevronRight className="h-5 w-5 rotate-180" /></button>
                  <button type="button" onClick={() => moveImage(1)} className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-950 shadow-lg transition-transform duration-150 hover:bg-white active:-translate-y-1/2 active:scale-95" aria-label="Next image"><ChevronRight className="h-5 w-5" /></button>
                </>
              )}
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                <div className="flex max-w-[calc(100%-96px)] gap-2 overflow-x-auto pb-1">{media.map((img, index) => <button type="button" key={img} onClick={() => setGallery({ listingId: listing.id, index })} className={classNames("h-16 w-20 shrink-0 overflow-hidden rounded-lg ring-2", index === activeImage ? "ring-white" : "ring-white/40")}><img src={img} alt="" className="h-full w-full object-cover" /></button>)}</div>
                <div className="rounded-full bg-slate-950/80 px-3 py-1 text-xs font-black text-white">{activeImage + 1}/{media.length}</div>
              </div>
            </div>
            <div className="sticky top-[76px] z-20 grid gap-2 border-b border-slate-100 bg-white/95 p-3 backdrop-blur md:grid-cols-5"><QuickStat label="Price" value={formatBDT(listing.price)} /><QuickStat label="Year" value={listing.year} /><QuickStat label="KM" value={`${listing.mileage.toLocaleString()} km`} /><QuickStat label="Fuel" value={listing.fuel} /><QuickStat label="Location" value={listing.city} /></div>
            <div className="p-6 lg:p-8">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><h1 className="text-3xl font-black tracking-tight text-slate-950">{listing.title}</h1><p className="mt-2 flex items-center gap-2 font-bold text-slate-500"><MapPin className="h-4 w-4 text-red-500" /> {listing.area}, {listing.city}</p><p className="mt-4 text-4xl font-black text-red-600">{formatBDT(listing.price)}</p><p className="mt-1 text-sm font-bold text-slate-500">{listing.negotiable ? "Negotiable" : "Fixed price"} - Posted {dateShort(listing.postedAt)}</p></div><div className="flex flex-wrap gap-2"><Button variant={state.saved.includes(listing.id) ? "primary" : "secondary"} disabled={actions.isPending("toggleSave", listing.id)} onClick={() => actions.toggleSave(listing.id)}><Heart className="h-4 w-4" /> {state.saved.includes(listing.id) ? "Saved" : "Save"}</Button><Button variant={state.compare.includes(listing.id) ? "blue" : "secondary"} disabled={actions.isPending("toggleCompare", listing.id)} onClick={() => actions.toggleCompare(listing.id)}><BarChart3 className="h-4 w-4" /> {state.compare.includes(listing.id) ? "Added" : "Compare"}</Button><Button variant="secondary" onClick={() => actions.shareListing(listing)}>Share</Button></div></div>
              <div className="mt-8 grid gap-6 lg:grid-cols-2"><InfoPanel title="Description"><p className="leading-7 text-slate-600">{listing.description}</p></InfoPanel><InfoPanel title="Full specification"><SpecGrid listing={listing} /></InfoPanel></div>
              <InfoPanel title="Credibility report" className="mt-8">{listing.inspectionReport ? <div className="grid gap-4 lg:grid-cols-[220px_1fr]"><div className="rounded-xl bg-emerald-50 p-5 text-center ring-1 ring-emerald-100"><p className="text-sm font-black text-emerald-700">Overall score</p><p className="mt-2 text-5xl font-black text-emerald-700">{listing.inspectionReport.overall}/100</p><p className="mt-2 text-sm font-bold text-emerald-900">{listing.inspectionReport.status}</p></div><div className="grid gap-2 md:grid-cols-2">{Object.entries(listing.inspectionReport.sections).map(([name, score]) => <div key={name} className="rounded-lg bg-slate-50 p-3"><p className="text-sm font-black">{name}</p><p className="text-sm font-bold text-slate-500">{score} points - {listing.inspectionReport.garage}</p></div>)}</div></div> : <EmptyState icon={ClipboardCheck} title="No credibility report yet" text="Book a 100-point inspection before token payment." action={<Button variant="blue" onClick={() => actions.go(`/inspect?listing=${listing.id}`)}>Book inspection</Button>} />}</InfoPanel>
              <div className="mt-8 grid gap-6 lg:grid-cols-2"><InfoPanel title="Warranty and escrow">{listing.warranty ? <div><Badge variant="green">Mercantile Islami Insurance placeholder</Badge><p className="mt-3 text-sm font-bold text-slate-600">Coverage: {listing.warranty.period}. Seller deposit held in escrow: {formatBDT(listing.warranty.deposit)}.</p><div className="mt-4 flex flex-wrap gap-2">{listing.warranty.covered.map((item) => <Badge key={item} variant="blue">{item}</Badge>)}</div><p className="mt-4 text-xs font-bold text-slate-500">Not covered: {listing.warranty.excluded.join(", ")}.</p></div> : <p className="text-sm font-bold text-slate-500">Warranty not attached. Admin can add escrow coverage after inspection.</p>}</InfoPanel><InfoPanel title="BRTA paperwork checklist"><Checklist items={["Registration certificate copies", "Tax token current year", "Fitness certificate", "Insurance certificate", "Form T.T.O.", "Seller NID copy", "Non-judicial stamp affidavit", "Bank NOC if under loan"]} /></InfoPanel></div>
              {/* Auction launch is deferred. Restore this listing auction panel when live bidding returns. */}
              {/* {auction && <InfoPanel title="Live auction" className="mt-8"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><p className="text-3xl font-black text-red-600">{formatBDT(auction.currentBid)}</p><p className="text-sm font-bold text-slate-500">Reserve hidden - {auction.watchers} watchers</p></div><Button variant="blue" onClick={() => actions.go(`/auction/${auction.id}`)}><Gavel className="h-4 w-4" /> Open auction</Button></div></InfoPanel>} */}
            </div>
          </div>
          <ListingRail title="Similar cars" listings={similar} state={state} actions={actions} />
        </section>
        <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><Badge variant={listing.verifiedSeller ? "green" : "yellow"}>{listing.verifiedSeller ? <ShieldCheck className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}{listing.verifiedSeller ? "Verified seller" : "Seller KYC pending"}</Badge><h2 className="mt-4 text-2xl font-black">{listing.sellerName}</h2><p className="mt-1 text-sm font-bold text-slate-500">{listing.sellerType} - Member since {listing.memberSince}</p><div className="mt-5 grid gap-3"><Button className="w-full" variant="blue" onClick={() => actions.openContact(listing)}><Phone className="h-4 w-4" /> Login-gated contact</Button><Button className="w-full" variant="secondary" onClick={() => actions.go(`/inspect?listing=${listing.id}`)}><ClipboardCheck className="h-4 w-4" /> Book inspection</Button><Button className="w-full" variant="secondary" onClick={() => actions.go("/financing")}><Calculator className="h-4 w-4" /> EMI calculator</Button></div><div className="mt-6 rounded-xl bg-slate-50 p-4"><p className="text-sm font-black text-slate-500">Buyer safety checklist</p><Checklist items={["Inspect before token", "Verify registration papers", "Use bank transfer trail", "Meet in a safe public location"]} /></div></aside>
      </div>
    </main>
  );
}

function QuickStat({ label, value }) {
  return <div className="rounded-lg bg-slate-50 px-3 py-2"><p className="text-xs font-black uppercase text-slate-400">{label}</p><p className="text-sm font-black text-slate-950">{value}</p></div>;
}

function InfoPanel({ title, children, className = "" }) {
  return <section className={classNames("rounded-2xl bg-white p-5 ring-1 ring-slate-200", className)}><h2 className="mb-4 text-xl font-black text-slate-950">{title}</h2>{children}</section>;
}

function SpecGrid({ listing }) {
  const specs = [["Make", listing.make], ["Model", listing.model], ["Variant", listing.variant], ["Chassis", listing.chassis], ["Registration", listing.registrationNo], ["Import grade", listing.auctionGrade], ["Origin", listing.origin], ["Import type", listing.importType], ["Engine", `${listing.displacement}cc band`], ["Drive", listing.driveType], ["Condition", listing.condition], ["Owners", listing.previousOwners], ["Accident", listing.accidentHistory], ["Flood", listing.floodHistory], ["Seats", listing.seats], ["Contact", listing.preferredContact]];
  return <div className="grid gap-2 md:grid-cols-2">{specs.map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-black uppercase text-slate-400">{label}</p><p className="mt-1 text-sm font-black text-slate-900">{value}</p></div>)}</div>;
}

function Checklist({ items }) {
  return <div className="mt-3 grid gap-2">{items.map((item) => <p key={item} className="flex gap-2 text-sm font-bold text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> {item}</p>)}</div>;
}

function EmptyState({ icon: Icon, title, text, action }) {
  return <div className="rounded-xl bg-slate-50 p-8 text-center"><Icon className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 text-lg font-black">{title}</p><p className="mx-auto mt-1 max-w-md text-sm font-bold text-slate-500">{text}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

function SellWizard({ state, actions }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ make: "Toyota", model: "", year: "2020", variant: "", chassis: "", registrationNo: "", auctionGrade: "4", origin: "Japan", importType: "Reconditioned (JDM)", displacement: "1301-1500", fuel: "Petrol", transmission: "Automatic", driveType: "FWD", engineCode: "", cylinders: "4", horsepower: "", turbo: false, mileage: "", odometerVerified: true, previousOwners: "1", accidentHistory: "No accident", floodHistory: "No", condition: "Good", lastServiceDate: "", serviceRecords: false, body: "Sedan", exteriorColor: "White", interiorColor: "Black", upholstery: "Fabric", doors: "4", seats: "5", selectedFeatures: ["ABS", "Airbags", "Reverse Camera"], price: "", negotiable: true, division: "Dhaka", district: "Dhaka", city: "Dhaka", area: "", preferredContact: "Both", phone: state.profile.phone, mediaReady: false, proShoot: false, declarations: false, sellerName: state.profile.name });
  const [listingDraftId] = useState(() => `draft-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`);
  const [mediaUploads, setMediaUploads] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const isSubmitting = actions.isPending("addListing");
  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const steps = ["Vehicle Identity", "Engine & Drivetrain", "Condition & History", "Body & Exterior", "Features", "Price & Location", "Media Upload", "Declaration"];
  const uploadImages = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    const openSlots = Math.max(0, 12 - mediaUploads.length);
    const selected = files.slice(0, openSlots);
    if (!selected.length) {
      setUploadStatus("You can upload up to 12 listing images.");
      return;
    }

    const body = new FormData();
    body.append("listingDraftId", listingDraftId);
    selected.forEach((file) => body.append("images", file));

    setIsUploading(true);
    setUploadStatus("Uploading images...");
    try {
      const response = await fetch("/api/uploads/listing-images", {
        method: "POST",
        body,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to upload images.");
      setMediaUploads((current) => [...current, ...result.images].slice(0, 12));
      setValue("mediaReady", true);
      setUploadStatus(`${result.images.length} image${result.images.length === 1 ? "" : "s"} uploaded.`);
    } catch (error) {
      setUploadStatus(error.message || "Unable to upload images.");
    } finally {
      setIsUploading(false);
    }
  };
  const removeImage = (url) => {
    setMediaUploads((current) => current.filter((image) => image.url !== url));
  };
  const submit = async () => {
    const required = [[form.model, "Model"], [form.chassis, "Chassis / VIN"], [form.mileage, "Mileage"], [form.price, "Asking price"], [form.phone, "Phone number"]];
    const missing = required.filter(([value]) => !String(value || "").trim()).map(([, label]) => label);
    if (missing.length) {
      actions.notify(`Complete these required fields: ${missing.join(", ")}.`);
      return;
    }
    if (!mediaUploads.length) {
      actions.notify("Upload at least one vehicle photo before submitting.");
      setStep(6);
      return;
    }
    const grouped = Object.fromEntries(Object.entries(featureGroups).map(([group, items]) => [group, items.filter((item) => form.selectedFeatures.includes(item))]));
    const media = mediaUploads.length ? mediaUploads.map((image) => image.url) : [];
    const saved = await actions.addListing({ title: `${form.year} ${form.make} ${form.model || "Model"} ${form.variant}`, ...form, sellerId: state.profile.id, year: Number(form.year), price: numberFrom(form.price), mileage: numberFrom(form.mileage), doors: Number(form.doors), seats: Number(form.seats), horsepower: numberFrom(form.horsepower), media, mediaUploads, mediaReady: mediaUploads.length > 0 || form.mediaReady, features: grouped, sellerType: state.profile.role === "dealer" ? "Dealer" : "Private Seller", verifiedSeller: false, kycStatus: "pending", certified: false, warrantyCovered: false, auctionEnabled: false, description: "Seller submitted this complete 8-step listing for BanglaWheel admin review." });
    if (saved) actions.go("/account/listings");
  };
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8"><Badge variant="red"><Car className="h-3.5 w-3.5" /> Seller center</Badge><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Eight-step listing submission</h1><p className="mt-2 max-w-3xl font-medium text-slate-600">Structured fields keep data ready for search, recommendations, inspection, KYC, warranty, and SEO.</p></div>
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">{steps.map((label, index) => <button key={label} onClick={() => setStep(index)} aria-current={step === index ? "step" : undefined} className={classNames("motion-control mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-black", step === index ? "bg-blue-700 text-white" : "bg-slate-50 text-slate-600 hover:bg-blue-50")}><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">{index + 1}</span>{label}</button>)}</aside>
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-black">{steps[step]}</h2>
          <motion.div key={step} {...panelMotion} className="mt-6 grid gap-4 md:grid-cols-2">
            {step === 0 && <><SelectField label="Make / Brand" value={form.make} onChange={(e) => setValue("make", e.target.value)}>{makes.map((x) => <option key={x}>{x}</option>)}</SelectField><TextInput label="Model" value={form.model} onChange={(e) => setValue("model", e.target.value)} required /><SelectField label="Year" value={form.year} onChange={(e) => setValue("year", e.target.value)}>{Array.from({ length: 37 }, (_, i) => 1990 + i).map((x) => <option key={x}>{x}</option>)}</SelectField><TextInput label="Variant / Grade" value={form.variant} onChange={(e) => setValue("variant", e.target.value)} /><TextInput label="Chassis / VIN" value={form.chassis} onChange={(e) => setValue("chassis", e.target.value)} required /><TextInput label="Registration No." value={form.registrationNo} onChange={(e) => setValue("registrationNo", e.target.value)} /><SelectField label="Import Grade" value={form.auctionGrade} onChange={(e) => setValue("auctionGrade", e.target.value)}>{["6", "5", "4.5", "4", "3.5", "3", "2", "1", "R", "RA", "N/A"].map((x) => <option key={x}>{x}</option>)}</SelectField><SelectField label="Import Type" value={form.importType} onChange={(e) => setValue("importType", e.target.value)}>{["Reconditioned (JDM)", "Brand New", "Local second-hand"].map((x) => <option key={x}>{x}</option>)}</SelectField></>}
            {step === 1 && <><SelectField label="Displacement" value={form.displacement} onChange={(e) => setValue("displacement", e.target.value)}>{["Under 660", "660-1000", "1001-1300", "1301-1500", "1501-1800", "1801-2000", "2001-2500", "Over 2500"].map((x) => <option key={x}>{x}</option>)}</SelectField><SelectField label="Fuel Type" value={form.fuel} onChange={(e) => setValue("fuel", e.target.value)}>{fuels.map((x) => <option key={x}>{x}</option>)}</SelectField><SelectField label="Transmission" value={form.transmission} onChange={(e) => setValue("transmission", e.target.value)}>{transmissions.map((x) => <option key={x}>{x}</option>)}</SelectField><SelectField label="Drive Type" value={form.driveType} onChange={(e) => setValue("driveType", e.target.value)}>{["FWD", "RWD", "AWD", "4WD"].map((x) => <option key={x}>{x}</option>)}</SelectField><TextInput label="Engine Code" value={form.engineCode} onChange={(e) => setValue("engineCode", e.target.value)} /><TextInput label="Horsepower" value={form.horsepower} onChange={(e) => setValue("horsepower", e.target.value)} /><label className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm font-black"><input type="checkbox" checked={form.turbo} onChange={(e) => setValue("turbo", e.target.checked)} /> Turbo</label></>}
            {step === 2 && <><TextInput label="Odometer Reading" value={form.mileage} onChange={(e) => setValue("mileage", e.target.value)} /><SelectField label="Previous Owners" value={form.previousOwners} onChange={(e) => setValue("previousOwners", e.target.value)}>{["1", "2", "3", "4+"].map((x) => <option key={x}>{x}</option>)}</SelectField><SelectField label="Accident History" value={form.accidentHistory} onChange={(e) => setValue("accidentHistory", e.target.value)}>{["No accident", "Minor (repaired)", "Major (repaired)", "Unknown"].map((x) => <option key={x}>{x}</option>)}</SelectField><SelectField label="Flood History" value={form.floodHistory} onChange={(e) => setValue("floodHistory", e.target.value)}>{["No", "Yes", "Unknown"].map((x) => <option key={x}>{x}</option>)}</SelectField><SelectField label="Overall Condition" value={form.condition} onChange={(e) => setValue("condition", e.target.value)}>{["Excellent", "Very Good", "Good", "Fair", "Needs Work"].map((x) => <option key={x}>{x}</option>)}</SelectField><TextInput label="Last Service Date" type="date" value={form.lastServiceDate} onChange={(e) => setValue("lastServiceDate", e.target.value)} /></>}
            {step === 3 && <><SelectField label="Body Type" value={form.body} onChange={(e) => setValue("body", e.target.value)}>{bodies.map((x) => <option key={x}>{x}</option>)}</SelectField><SelectField label="Exterior Colour" value={form.exteriorColor} onChange={(e) => setValue("exteriorColor", e.target.value)}>{["White", "Silver", "Black", "Grey", "Red", "Blue", "Gold", "Other"].map((x) => <option key={x}>{x}</option>)}</SelectField><SelectField label="Interior Colour" value={form.interiorColor} onChange={(e) => setValue("interiorColor", e.target.value)}>{["Beige", "Black", "Grey", "Brown", "Other"].map((x) => <option key={x}>{x}</option>)}</SelectField><SelectField label="Upholstery" value={form.upholstery} onChange={(e) => setValue("upholstery", e.target.value)}>{["Fabric", "Leather", "Half-Leather", "Synthetic Leather"].map((x) => <option key={x}>{x}</option>)}</SelectField><SelectField label="Doors" value={form.doors} onChange={(e) => setValue("doors", e.target.value)}>{["2", "4", "5"].map((x) => <option key={x}>{x}</option>)}</SelectField><SelectField label="Seating Capacity" value={form.seats} onChange={(e) => setValue("seats", e.target.value)}>{["2", "4", "5", "6", "7", "8"].map((x) => <option key={x}>{x}</option>)}</SelectField></>}
            {step === 4 && <div className="md:col-span-2 grid gap-4 md:grid-cols-2">{Object.entries(featureGroups).map(([group, items]) => <div key={group} className="rounded-xl bg-slate-50 p-4"><p className="mb-3 font-black">{group}</p><div className="grid gap-2">{items.map((item) => <label key={item} className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.selectedFeatures.includes(item)} onChange={(e) => setValue("selectedFeatures", e.target.checked ? [...form.selectedFeatures, item] : form.selectedFeatures.filter((x) => x !== item))} /> {item}</label>)}</div></div>)}</div>}
            {step === 5 && <><TextInput label="Asking Price (BDT)" value={form.price} onChange={(e) => setValue("price", e.target.value)} /><SelectField label="Division" value={form.division} onChange={(e) => setValue("division", e.target.value)}>{cities.map((x) => <option key={x}>{x}</option>)}</SelectField><TextInput label="District" value={form.district} onChange={(e) => setValue("district", e.target.value)} /><TextInput label="Area / Thana" value={form.area} onChange={(e) => setValue("area", e.target.value)} /><SelectField label="Preferred Contact" value={form.preferredContact} onChange={(e) => setValue("preferredContact", e.target.value)}>{["WhatsApp only", "Phone only", "Both"].map((x) => <option key={x}>{x}</option>)}</SelectField><TextInput label="Phone Number" value={form.phone} onChange={(e) => setValue("phone", e.target.value)} /></>}
            {step === 6 && (
              <div className="md:col-span-2">
                <label className="motion-control flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 px-5 py-8 text-center hover:bg-blue-100">
                  <Upload className="h-8 w-8 text-blue-700" />
                  <span className="mt-3 text-sm font-black text-blue-950">{isUploading ? "Uploading..." : "Upload listing photos"}</span>
                  <span className="mt-1 text-xs font-bold text-blue-800">JPG, PNG, WebP, or GIF. Up to 12 images, 8 MB each.</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={uploadImages} disabled={isUploading || mediaUploads.length >= 12} />
                </label>
                {uploadStatus && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">{uploadStatus}</p>}
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {mediaUploads.map((image, index) => (
                    <div key={image.url} className="overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200">
                      <img src={image.url} alt={image.name || `Listing image ${index + 1}`} className="h-36 w-full object-cover" />
                      <div className="flex items-center justify-between gap-2 p-3">
                        <p className="min-w-0 truncate text-xs font-black text-slate-600">{index === 0 ? "Cover photo" : image.name}</p>
                        <button type="button" onClick={() => removeImage(image.url)} className="rounded-md px-2 py-1 text-xs font-black text-red-600 hover:bg-red-50">Remove</button>
                      </div>
                    </div>
                  ))}
                  {!mediaUploads.length && ["Front", "Rear", "Interior"].map((slot) => <div key={slot} className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center"><Upload className="mx-auto h-7 w-7 text-slate-400" /><p className="mt-2 text-sm font-black">{slot}</p></div>)}
                </div>
                <label className="mt-5 flex items-center gap-3 rounded-xl bg-blue-50 p-4 text-sm font-black text-blue-900"><input type="checkbox" checked={form.proShoot} onChange={(e) => setValue("proShoot", e.target.checked)} /> Request BanglaWheel Professional Shoot</label>
              </div>
            )}
            {step === 7 && <div className="md:col-span-2"><Checklist items={["I confirm this vehicle is legally mine to sell.", "All information provided is accurate to the best of my knowledge.", "I agree to BanglaWheel Terms and Privacy Policy.", "I consent to NID verification via Bangladesh Election Commission database."]} /><label className="mt-5 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm font-black text-emerald-900"><input type="checkbox" checked={form.declarations} onChange={(e) => setValue("declarations", e.target.checked)} /> I accept all declarations</label></div>}
          </motion.div>
          <div className="mt-8 flex flex-wrap justify-between gap-3"><Button variant="secondary" disabled={step === 0 || isSubmitting} onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</Button>{step < steps.length - 1 ? <Button variant="blue" onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))}>Continue</Button> : <Button onClick={submit} disabled={!form.declarations || isSubmitting} aria-busy={isSubmitting}>{isSubmitting ? <><RefreshCw className="h-4 w-4 animate-spin" /> Submitting...</> : "Submit for approval"}</Button>}</div>
        </section>
      </div>
    </main>
  );
}

function DealersPage({ state, actions }) {
  return <DirectoryPage title="Verified dealer directory" badge="Dealer network" items={state.dealers} icon={Store} render={(dealer) => <div><div className="flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Store /></div>{dealer.verified && <Badge variant="green"><ShieldCheck className="h-3.5 w-3.5" /> Verified</Badge>}</div><h2 className="mt-5 text-xl font-black">{dealer.name}</h2><p className="mt-1 text-sm font-bold text-slate-500">{dealer.area}, {dealer.city}</p><div className="mt-4 grid grid-cols-2 gap-3 text-sm font-black"><div className="rounded-lg bg-slate-50 p-3"><Star className="mb-1 h-4 w-4 text-amber-500" /> {dealer.rating}</div><div className="rounded-lg bg-slate-50 p-3"><Car className="mb-1 h-4 w-4 text-blue-700" /> {dealer.inventory} cars</div></div><div className="mt-4 flex flex-wrap gap-2">{dealer.specialties.map((x) => <Badge key={x}>{x}</Badge>)}</div><Button className="mt-5 w-full" variant="blue" onClick={() => actions.go(`/dealers/${dealer.slug}`)}>Open showroom</Button></div>} />;
}

function DealerDetailPage({ state, actions, slug }) {
  const dealer = state.dealers.find((item) => item.slug === slug) || state.dealers[0];
  const publicListings = approvedOnly(state.listings);
  const inventory = publicListings.filter((item) => item.sellerId === dealer.id);
  const reviews = [
    ["Paperwork support was clear", "Verified buyer", "5.0"],
    ["Inspection booking was fast", "Hybrid buyer", "4.8"],
    ["Good response time on final price", "Verified buyer", "4.7"],
  ];
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><section className="rounded-2xl bg-slate-950 p-8 text-white"><Badge variant="dark">Verified showroom</Badge><h1 className="mt-4 text-4xl font-black">{dealer.name}</h1><p className="mt-2 font-bold text-blue-100">{dealer.area}, {dealer.city} - {dealer.phone}</p><div className="mt-6 grid gap-4 md:grid-cols-4"><StatCard label="Inventory" value={inventory.length} icon={Car} /><StatCard label="Rating" value={dealer.rating} icon={Star} tone="yellow" /><StatCard label="Plan" value={dealer.plan} icon={BadgeCheck} tone="green" /><StatCard label="Specialties" value={dealer.specialties.length} icon={Sparkles} tone="red" /></div></section><div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]"><ListingRail title="Dealer listings" listings={inventory.length ? inventory : publicListings.slice(0, 3)} state={state} actions={actions} /><InfoPanel title="Buyer reviews">{reviews.map(([text, author, score]) => <div key={text} className="mb-3 rounded-xl bg-slate-50 p-4"><p className="font-black">{score} / 5</p><p className="mt-1 text-sm font-bold text-slate-600">{text}</p><p className="mt-2 text-xs font-black uppercase text-slate-400">{author}</p></div>)}<Button className="w-full" variant="secondary" disabled={!inventory[0] && !publicListings[0]} onClick={() => actions.openContact((inventory[0] || publicListings[0]))}>Contact showroom</Button></InfoPanel></div></main>;
}

function DirectoryPage({ title, badge, items, render }) {
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="mb-8"><Badge variant="blue">{badge}</Badge><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h1></div><div className="grid gap-4 md:grid-cols-3">{items.map((item) => <article key={item.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">{render(item)}</article>)}</div></main>;
}

// eslint-disable-next-line no-unused-vars
function AuctionListPageDeferred({ state, actions }) {
  const auctions = state.auctions.map((auction) => ({ ...auction, listing: state.listings.find((listing) => listing.id === auction.listingId) })).filter((x) => x.listing);
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="mb-8"><Badge variant="purple"><Gavel className="h-3.5 w-3.5" /> BanglaWheel Bid</Badge><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Live and upcoming auctions</h1><p className="mt-2 text-slate-600 font-medium">Real-time mechanics are mocked now and shaped for Socket.io later.</p></div><div className="grid gap-6 md:grid-cols-2">{auctions.map((auction) => <article key={auction.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"><img src={auction.listing.media[0]} alt="" className="h-64 w-full object-cover" /><div className="p-6"><div className="flex items-center justify-between"><Badge variant="green">{auction.status}</Badge><Badge variant="yellow"><Clock3 className="h-3.5 w-3.5" /> Anti-sniping</Badge></div><h2 className="mt-4 text-2xl font-black">{auction.listing.title}</h2><p className="mt-2 text-sm font-bold text-slate-500">Ends {dateShort(auction.endsAt)} - {auction.watchers} watchers</p><p className="mt-4 text-3xl font-black text-red-600">{formatBDT(auction.currentBid)}</p><Button className="mt-5 w-full" variant="blue" onClick={() => actions.go(`/auction/${auction.id}`)}>Enter auction</Button></div></article>)}</div></main>;
}

// eslint-disable-next-line no-unused-vars
function AuctionDetailPageDeferred({ state, actions, id }) {
  const auction = state.auctions.find((item) => item.id === id) || state.auctions[0];
  const listing = state.listings.find((item) => item.id === auction.listingId);
  const [bid, setBid] = useState(String(auction.currentBid + auction.increment));
  const [autoBid, setAutoBid] = useState("");
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="grid gap-8 lg:grid-cols-[1fr_380px]"><section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"><img src={listing.media[0]} alt="" className="h-[440px] w-full object-cover" /><div className="p-6"><Badge variant="purple"><Gavel className="h-3.5 w-3.5" /> Live auction</Badge><h1 className="mt-4 text-3xl font-black">{listing.title}</h1><div className="mt-6 grid gap-4 md:grid-cols-4"><StatCard label="Current bid" value={formatBDT(auction.currentBid)} icon={Banknote} tone="red" /><StatCard label="Increment" value={formatBDT(auction.increment)} icon={RefreshCw} /><StatCard label="Watchers" value={auction.watchers} icon={Bell} tone="yellow" /><StatCard label="Deposit due" value="24h" icon={Clock3} tone="green" /></div></div></section><aside className="h-fit rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Place bid</h2><p className="mt-2 text-sm font-bold text-slate-500">Reserve is hidden. Bid in final 5 minutes extends timer by 10 minutes.</p><div className="mt-5 grid gap-3"><TextInput label="Bid amount" value={bid} onChange={(e) => setBid(e.target.value)} /><TextInput label="Auto-bid max" value={autoBid} onChange={(e) => setAutoBid(e.target.value)} placeholder="Optional" /><Button variant="blue" onClick={() => actions.addBid(auction.id, numberFrom(bid), autoBid)}>Place bid</Button></div><h3 className="mt-8 font-black">Bid history</h3><div className="mt-3 grid gap-3">{auction.bidHistory.map((entry, index) => <div key={`${entry.bidder}-${index}`} className="rounded-xl bg-slate-50 p-3"><p className="font-black">{entry.bidder}</p><p className="text-sm font-bold text-slate-500">{formatBDT(entry.amount)} - {entry.at}</p></div>)}</div></aside></div></main>;
}

function CertifiedPage({ state, actions }) {
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200"><Badge variant="green"><ShieldCheck className="h-3.5 w-3.5" /> BanglaWheel Certified</Badge><h1 className="mt-4 text-4xl font-black">Certified means inspected, scored, and admin-reviewed.</h1><p className="mt-3 max-w-3xl font-medium leading-7 text-slate-600">Cars scoring 70/100 or above receive a Certified badge. Scores 90-100 are Excellent, 80-89 Very Good, 70-79 Good with advisories, 60-69 inspected but not certified.</p><div className="mt-8 grid gap-4 md:grid-cols-5">{["90-100 Excellent", "80-89 Very Good", "70-79 Certified", "60-69 Inspected", "<60 Not Certified"].map((x) => <div key={x} className="rounded-xl bg-slate-50 p-4 text-sm font-black">{x}</div>)}</div></section><ListingRail title="Certified inventory" listings={approvedOnly(state.listings).filter((item) => item.certified)} state={state} actions={actions} /></main>;
}

function GaragesPage({ state }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8"><Badge variant="green"><ClipboardCheck className="h-3.5 w-3.5" /> Garage Portal ready</Badge><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Certified garage partner directory</h1></div>
      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <section className="grid gap-4 md:grid-cols-2">{state.garages.map((garage) => <article key={garage.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><ClipboardCheck /></div><Badge variant="green">{garage.rating}</Badge></div><h2 className="mt-5 text-xl font-black">{garage.name}</h2><p className="mt-1 text-sm font-bold text-slate-500">{garage.area}, {garage.city}</p><p className="mt-3 text-sm font-bold text-slate-600">{garage.inspections} completed inspections</p><div className="mt-4 flex flex-wrap gap-2">{garage.capabilities.map((x) => <Badge key={x} variant="blue">{x}</Badge>)}</div><div className="mt-5 grid grid-cols-2 gap-2 text-xs font-black text-slate-500"><span>Lat {garage.lat}</span><span>Lng {garage.lng}</span></div></article>)}</section>
        <aside className="h-fit rounded-2xl bg-slate-950 p-5 text-white shadow-xl">
          <p className="text-sm font-black text-blue-200">Map preview</p>
          <div className="relative mt-4 aspect-square overflow-hidden rounded-xl bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_45%,#16a34a_100%)]">
            <div className="absolute inset-4 rounded-xl border border-white/20" />
            {state.garages.map((garage, index) => <div key={garage.id} className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2" style={{ left: `${30 + index * 24}%`, top: `${34 + index * 18}%` }}><span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-lg"><MapPin className="h-5 w-5" /></span><span className="hidden rounded-lg bg-white px-2 py-1 text-xs font-black text-slate-950 sm:block">{garage.area}</span></div>)}
          </div>
          <p className="mt-4 text-sm font-bold text-slate-300">Mapbox or Google Maps can replace this mock without changing the directory layout.</p>
        </aside>
      </div>
    </main>
  );
}

function InspectPage({ state, actions, params }) {
  const [form, setForm] = useState({ listingId: params.get("listing") || state.listings[0]?.id || "", garageId: state.garages[0]?.id || "", name: state.profile.name, phone: state.profile.phone, preferredDate: "", packageName: "100-point pre-purchase inspection" });
  const score = inspectionSections.reduce((sum, section) => sum + section.points, 0);
  const pending = actions.isPending("addInspection");
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="mb-8"><Badge variant="green"><ClipboardCheck className="h-3.5 w-3.5" /> Inspection system</Badge><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Book and score a 100-point inspection</h1></div><div className="grid gap-8 lg:grid-cols-[1fr_420px]"><section className="grid gap-4 md:grid-cols-2">{inspectionSections.map((section) => <div key={section.name} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-center justify-between"><h2 className="font-black">{section.name}</h2><Badge variant="blue">{section.points} pts</Badge></div><div className="mt-3 grid gap-1 text-xs font-bold text-slate-500">{section.items.slice(0, 8).map((item) => <p key={item}>• {item}</p>)}<p className="font-black text-blue-700">+ {Math.max(0, section.items.length - 8)} more checks</p></div></div>)}</section><form onSubmit={(e) => { e.preventDefault(); actions.addInspection(form); }} className="h-fit rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Inspection request</h2><p className="mt-2 text-sm font-bold text-slate-500">Total checklist weight: {score} points.</p><div className="mt-5 grid gap-4"><SelectField label="Listing" value={form.listingId} onChange={(e) => setForm({ ...form, listingId: e.target.value })} required>{state.listings.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</SelectField><SelectField label="Garage" value={form.garageId} onChange={(e) => setForm({ ...form, garageId: e.target.value })} required>{state.garages.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</SelectField><TextInput label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /><TextInput label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /><TextInput label="Preferred date" type="date" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} required /><Button type="submit" variant="blue" disabled={pending} aria-busy={pending}>{pending ? <><RefreshCw className="h-4 w-4 animate-spin" /> Requesting...</> : "Request inspection"}</Button></div></form></div></main>;
}

function WarrantyPage({ state, actions }) {
  const [claim, setClaim] = useState({ listingId: state.warranties[0]?.listingId || state.listings[0]?.id || "", issue: "" });
  const pending = actions.isPending("addClaim");
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="mb-8"><Badge variant="red"><WalletCards className="h-3.5 w-3.5" /> Warranty escrow</Badge><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Insurance-backed warranty prototype</h1></div><div className="grid gap-8 lg:grid-cols-[1fr_420px]"><section className="grid gap-4 md:grid-cols-2">{[[`Under ${formatBDT(500000)}`, formatBDT(10000), "90 days"], [`${formatBDT(500000)} - ${formatBDT(1000000)}`, formatBDT(20000), "90 days"], [`${formatBDT(1000000)} - ${formatBDT(2000000)}`, formatBDT(35000), "6 months"], [`Above ${formatBDT(2000000)}`, formatBDT(50000), "6 months"]].map(([price, deposit, coverage]) => <div key={price} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-black text-slate-500">{price}</p><p className="mt-3 text-3xl font-black text-red-600">{deposit}</p><p className="mt-2 font-bold text-slate-600">{coverage} coverage</p></div>)}</section><form onSubmit={async (e) => { e.preventDefault(); const saved = await actions.addClaim(claim); if (saved) setClaim({ ...claim, issue: "" }); }} className="h-fit rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-black">Open warranty claim</h2><div className="mt-5 grid gap-4"><SelectField label="Warranty car" value={claim.listingId} onChange={(e) => setClaim({ ...claim, listingId: e.target.value })} required>{state.warranties.map((w) => <option key={w.id} value={w.listingId}>{state.listings.find((x) => x.id === w.listingId)?.title}</option>)}</SelectField><TextArea label="Issue" value={claim.issue} onChange={(e) => setClaim({ ...claim, issue: e.target.value })} placeholder="Engine, transmission, electrical, AC compressor..." required /><Button type="submit" disabled={pending} aria-busy={pending}>{pending ? <><RefreshCw className="h-4 w-4 animate-spin" /> Submitting...</> : "Submit claim"}</Button></div><div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-600">Status flow: Submitted to Under Review to Approved to Repair Scheduled to Resolved.</div></form></div><div className="mt-8 grid gap-4 md:grid-cols-2">{state.warranties.map((warranty) => <InfoPanel key={warranty.id} title={state.listings.find((x) => x.id === warranty.listingId)?.title || "Warranty"}><p className="font-bold text-slate-600">Escrow: {formatBDT(warranty.deposit)} - {warranty.escrowStatus}</p><div className="mt-3 grid gap-2">{warranty.claims.length ? warranty.claims.map((c) => <p key={c.id} className="rounded-lg bg-slate-50 p-3 text-sm font-bold">{c.issue} - {c.status}</p>) : <p className="text-sm font-bold text-slate-500">No claims.</p>}</div></InfoPanel>)}</div></main>;
}

function FinancingPage({ state, actions }) {
  const [form, setForm] = useState({ price: "3500000", down: "30", tenure: "5", name: state.profile.name, phone: state.profile.phone });
  const pending = actions.isPending("submitLead");
  const price = numberFrom(form.price);
  const downPayment = Math.round(price * (Number(form.down) / 100));
  const principal = Math.max(0, price - downPayment);
  const months = Number(form.tenure) * 12;
  const offers = state.financePartners.map((bank) => {
    const r = bank.rate / 100 / 12;
    const emi = Math.round((principal * r * (1 + r) ** months) / ((1 + r) ** months - 1));
    const processingFee = Math.round(price * 0.01);
    const insurance = Math.round(price * 0.012);
    return { ...bank, emi, processingFee, insurance, upfront: downPayment + processingFee + insurance, totalPayable: emi * months + downPayment + processingFee + insurance };
  });
  const bestOffer = [...offers].sort((a, b) => a.emi - b.emi)[0] || { emi: 0, bank: "No bank", product: "Load financing partners" };
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
        <div>
          <Badge variant="blue"><Banknote className="h-3.5 w-3.5" /> Financing partners</Badge>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Loan / EMI calculator and partner bank offers</h1>
          <p className="mt-3 max-w-3xl font-medium leading-7 text-slate-600">Compare IFIC, IPDC, BRAC Bank, and Dutch-Bangla Bank estimates from the project plan. This is API-shaped mock logic now; real bank integrations can replace the service later.</p>
        </div>
        <div className="rounded-2xl bg-slate-950 p-5 text-white">
          <p className="text-sm font-black text-blue-200">Best monthly estimate</p>
          <p className="mt-2 text-4xl font-black">{formatBDT(bestOffer.emi)}</p>
          <p className="mt-1 text-sm font-bold text-slate-300">{bestOffer.bank} - {bestOffer.product}</p>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black">Calculator inputs</h2>
          <div className="mt-5 grid gap-4">
            <TextInput label="Car price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <SelectField label="Down payment" value={form.down} onChange={(e) => setForm({ ...form, down: e.target.value })}>{["25", "30", "35", "40", "50"].map((x) => <option key={x} value={x}>{x}%</option>)}</SelectField>
            <SelectField label="Tenure" value={form.tenure} onChange={(e) => setForm({ ...form, tenure: e.target.value })}>{["1", "2", "3", "4", "5"].map((x) => <option key={x} value={x}>{x} years</option>)}</SelectField>
            <TextInput label="Applicant name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextInput label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Button disabled={pending || !form.name.trim() || !form.phone.trim() || price <= 0} aria-busy={pending} onClick={() => actions.submitLead({ listingId: "finance", listingTitle: "Financing application", sellerName: "Finance desk", sellerPhone: "096000000", buyerName: form.name, buyerPhone: form.phone, message: `Financing lead request for ${formatBDT(price)} car` })}>{pending ? <><RefreshCw className="h-4 w-4 animate-spin" /> Applying...</> : "Apply now"}</Button>
          </div>
          <div className="mt-5 grid gap-2 rounded-xl bg-blue-50 p-4 text-sm font-bold text-blue-950">
            <p className="flex justify-between"><span>Down payment</span><span>{formatBDT(downPayment)}</span></p>
            <p className="flex justify-between"><span>Loan principal</span><span>{formatBDT(principal)}</span></p>
            <p className="flex justify-between"><span>Tenure</span><span>{months} months</span></p>
          </div>
          <p className="mt-4 text-xs font-bold text-slate-500">Required disclaimer: Actual rates subject to bank approval.</p>
        </aside>
        <section className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-4">{offers.map((offer) => <div key={offer.bank} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><Badge variant={offer.type === "Islamic" ? "green" : "blue"}>{offer.type}</Badge><h2 className="mt-4 text-lg font-black">{offer.bank}</h2><p className="mt-1 text-sm font-bold text-slate-500">{offer.product}</p><p className="mt-4 text-2xl font-black text-red-600">{formatBDT(offer.emi)}</p><p className="mt-1 text-xs font-bold text-slate-500">Rate {offer.rate}% - max {formatBDT(offer.maxLoan)}</p></div>)}</div>
          <div className="overflow-x-auto rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead><tr>{["Bank", "Product", "Max loan", "Tenure", "Rate", "Monthly EMI", "Upfront", "Total payable"].map((h) => <th key={h} className="bg-slate-950 p-4 text-white first:rounded-l-lg last:rounded-r-lg">{h}</th>)}</tr></thead>
              <tbody>{offers.map((offer) => <tr key={offer.bank}><td className="border-b border-slate-100 p-4 font-black">{offer.bank}</td><td className="border-b border-slate-100 p-4 font-bold">{offer.product}</td><td className="border-b border-slate-100 p-4 font-bold">{formatBDT(offer.maxLoan)}</td><td className="border-b border-slate-100 p-4 font-bold">{offer.tenure} years</td><td className="border-b border-slate-100 p-4 font-bold">{offer.rate}%</td><td className="border-b border-slate-100 p-4 font-black text-red-600">{formatBDT(offer.emi)}</td><td className="border-b border-slate-100 p-4 font-bold">{formatBDT(offer.upfront)}</td><td className="border-b border-slate-100 p-4 font-bold">{formatBDT(offer.totalPayable)}</td></tr>)}</tbody>
            </table>
          </div>
          <InfoPanel title="Required documents"><Checklist items={["NID and recent photographs", "6-month bank statement", "Income proof or salary certificate", "Employment or business proof", "Vehicle quotation or selected BanglaWheel listing", "Preferred bank and Islamic finance preference if any"]} /></InfoPanel>
        </section>
      </div>
    </main>
  );
}

function PaperworkPage() {
  const [declaredValue, setDeclaredValue] = useState("3500000");
  const [engineCc, setEngineCc] = useState("1500");
  const value = numberFrom(declaredValue);
  const cc = numberFrom(engineCc);
  const estimate = Math.round(value * 0.01 + Math.max(0, cc - 1000) * 15);
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="mb-8"><Badge variant="green"><FileCheck2 className="h-3.5 w-3.5" /> BRTA paperwork</Badge><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Ownership transfer guide and fee checklist</h1></div><div className="grid gap-6 lg:grid-cols-[1fr_360px]"><InfoPanel title="Documents to check"><Checklist items={["Registration Certificate: chassis must match and not be mortgaged.", "Tax Token: current year and chassis matches.", "Fitness Certificate: not expired.", "Insurance Certificate: valid and chassis matches.", "Form T.T.O.: seller signs transfer order.", "Seller NID: name and photo match seller.", "Non-Judicial Stamp Affidavit: sworn sale statement.", "Bank NOC: required if under loan."]} /></InfoPanel><InfoPanel title="Transfer preparation estimate"><div className="grid gap-4"><TextInput label="Declared value" inputMode="numeric" value={declaredValue} onChange={(event) => setDeclaredValue(event.target.value)} /><TextInput label="Engine CC" inputMode="numeric" value={engineCc} onChange={(event) => setEngineCc(event.target.value)} /></div><div className="mt-4 rounded-xl bg-blue-50 p-4"><p className="text-xs font-black uppercase text-blue-700">Estimated preparation</p><p className="mt-1 text-2xl font-black text-blue-950">{formatBDT(estimate)}</p><p className="mt-2 text-xs font-bold leading-5 text-blue-800">Planning estimate only. Confirm the final amount with BRTA for the vehicle class and current tax status.</p></div></InfoPanel></div></main>;
}

function LearnPage({ state, actions, locale }) {
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="mb-8"><Badge variant="blue"><BookOpen className="h-3.5 w-3.5" /> Buyer Education Hub</Badge><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">CMS-shaped articles in English and Bangla</h1></div><div className="grid gap-4 md:grid-cols-3">{state.articles.map((article) => <button key={article.id} onClick={() => actions.go(`/learn/${article.slug}`)} className="rounded-2xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200 hover:shadow-xl"><Badge>{article.seo}</Badge><h2 className="mt-4 text-xl font-black">{article.title[locale]}</h2><p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">{article.body[locale]}</p></button>)}</div></main>;
}

function ArticlePage({ state, slug, locale }) {
  const article = state.articles.find((item) => item.slug === slug) || state.articles[0];
  return <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8"><Badge variant="blue">Article structured data ready</Badge><h1 className="mt-5 text-4xl font-black leading-tight">{article.title[locale]}</h1><p className="mt-3 text-sm font-bold text-slate-500">SEO target: {article.seo}</p><article className="mt-8 rounded-2xl bg-white p-8 text-lg font-medium leading-9 text-slate-700 shadow-sm ring-1 ring-slate-200">{article.body[locale]} This article is stored in the same shape a future Sanity.io integration can return, with separate English and Bangla fields.</article></main>;
}

function ComparePage({ state, actions }) {
  const selected = state.listings.filter((item) => state.compare.includes(item.id)).slice(0, 3);
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="mb-8"><Badge variant="blue"><BarChart3 className="h-3.5 w-3.5" /> Compare</Badge><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Side-by-side comparison</h1></div>{selected.length === 0 ? <EmptyState icon={BarChart3} title="No cars selected" text="Add cars from browse or detail pages." action={<Button onClick={() => actions.go("/cars")}>Browse cars</Button>} /> : <div className="overflow-x-auto rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><table className="w-full min-w-[780px] text-left text-sm"><tbody>{["title", "price", "year", "mileage", "fuel", "transmission", "condition", "certified", "warrantyCovered"].map((field) => <tr key={field}><td className="border-b border-slate-100 bg-slate-50 p-4 font-black capitalize">{field}</td>{selected.map((listing) => <td key={listing.id} className="border-b border-slate-100 p-4 font-bold">{field === "price" ? formatBDT(listing[field]) : field === "mileage" ? `${listing[field].toLocaleString()} km` : typeof listing[field] === "boolean" ? (listing[field] ? "Yes" : "No") : listing[field]}</td>)}</tr>)}</tbody></table></div>}</main>;
}

function AccountPage({ state, actions, path, locale, setLocale }) {
  const tab = path.split("/")[2] || "overview";
  const tabs = [
    ["overview", "Overview"],
    ["listings", "My Listings"],
    // Auction launch is deferred. Restore account bids tab when live bidding returns.
    // ["bids", "Bids"],
    ["warranty", "Warranty"],
    ["documents", "Documents"],
    ["settings", "Settings"],
  ];
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge variant="red"><UserRound className="h-3.5 w-3.5" /> Account dashboard</Badge>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Buyer and seller workspace</h1>
          <p className="mt-2 max-w-2xl font-medium text-slate-600">Saved cars, listings, warranty claims, KYC documents, notifications, language, and budget preferences.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => actions.go("/compare")}><BarChart3 className="h-4 w-4" /> Compare</Button>
          {["seller", "dealer", "admin"].includes(state.profile.role) && <Button onClick={() => actions.go("/sell")}><Car className="h-4 w-4" /> New listing</Button>}
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          {tabs.map(([key, label]) => <button key={key} onClick={() => actions.go(key === "overview" ? "/account" : `/account/${key}`)} className={classNames("motion-control mb-2 flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-black", tab === key ? "bg-blue-700 text-white" : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700")}><span>{label}</span><ChevronRight className="h-4 w-4" /></button>)}
        </aside>
        <motion.section key={tab} {...panelMotion}>
          {tab === "overview" && <AccountOverview state={state} actions={actions} />}
          {tab === "listings" && <AccountListings state={state} actions={actions} />}
          {/* Auction launch is deferred. Restore account bid history when live bidding returns. */}
          {/* {tab === "bids" && <AccountBids state={state} actions={actions} />} */}
          {tab === "warranty" && <AccountWarranty state={state} actions={actions} />}
          {tab === "documents" && <KycPanel state={state} actions={actions} />}
          {tab === "settings" && <SettingsPanel state={state} locale={locale} setLocale={setLocale} actions={actions} />}
        </motion.section>
      </div>
    </main>
  );
}

function AccountOverview({ state, actions }) {
  const savedListings = state.listings.filter((listing) => state.saved.includes(listing.id));
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Saved cars" value={state.saved.length} icon={Heart} />
        {/* Auction launch is deferred. Restore this active bids stat when live bidding returns. */}
        {/* <StatCard label="Active bids" value={state.auctions.filter((a) => a.status === "live").length} icon={Gavel} tone="yellow" /> */}
        <StatCard label="Warranties" value={state.warranties.length} icon={WalletCards} tone="red" />
        <StatCard label="Notifications" value={state.notifications.length} icon={Bell} tone="green" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <InfoPanel title="Saved cars">{savedListings.length ? <div className="grid gap-3">{savedListings.map((listing) => <button key={listing.id} onClick={() => actions.go(`/cars/${listing.slug}`)} className="motion-control flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-left hover:bg-blue-50"><img src={listing.media[0]} alt="" className="h-16 w-20 rounded-lg object-cover" /><span><span className="block font-black">{listing.title}</span><span className="text-sm font-bold text-red-600">{formatBDT(listing.price)}</span></span></button>)}</div> : <EmptyState icon={Heart} title="No saved cars" text="Save listings from browse or detail pages." action={<Button onClick={() => actions.go("/cars")}>Browse cars</Button>} />}</InfoPanel>
        <InfoPanel title="Notifications">{state.notifications.map((note) => <div key={note.id} className="mb-2 rounded-xl bg-slate-50 p-3"><p className="font-black">{note.title}</p><p className="text-sm font-bold text-slate-500">{note.body}</p></div>)}</InfoPanel>
      </div>
    </div>
  );
}

function AccountListings({ state, actions }) {
  const [status, setStatus] = useState("all");
  const mine = state.listings
    .filter((listing) => listing.sellerId === state.profile.id || listing.sellerName === state.profile.name)
    .sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0));
  const counts = {
    all: mine.length,
    pending: mine.filter((listing) => listing.status === "pending").length,
    approved: mine.filter((listing) => listing.status === "approved").length,
    rejected: mine.filter((listing) => listing.status === "rejected").length,
  };
  const visible = status === "all" ? mine : mine.filter((listing) => listing.status === status);
  const statusTone = { approved: "green", pending: "yellow", rejected: "red" };
  return (
    <InfoPanel title="My vehicle inventory">
      {mine.length ? <>
        <StatusTabs
          value={status}
          onChange={setStatus}
          tabs={[["all", "All cars"], ["pending", "Pending review"], ["approved", "Approved"], ["rejected", "Rejected"]]}
          counts={counts}
        />
        {visible.length ? <motion.div layout className="mt-5 grid gap-3"><AnimatePresence initial={false} mode="popLayout">{visible.map((listing) => (
        <motion.div layout="position" {...itemMotion} key={listing.id} className="grid gap-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100 lg:grid-cols-[96px_1fr_auto] lg:items-center">
          <img src={listing.media?.[0] || "https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=800&auto=format&fit=crop"} alt="" className="h-20 w-24 rounded-lg object-cover" />
          <div>
            <div className="flex flex-wrap items-center gap-2"><p className="font-black">{listing.title}</p><Badge variant={statusTone[listing.status] || "default"}>{listing.status === "pending" ? "Pending admin review" : listing.status}</Badge></div>
            <p className="mt-1 text-sm font-bold text-slate-500">{listing.status === "approved" ? `${Number(listing.views || 0).toLocaleString()} views - Live in the marketplace` : listing.status === "pending" ? "Submitted successfully - awaiting admin review" : "Not published - contact support or submit a corrected ad"} - {formatBDT(listing.price)}</p>
            <div className="mt-2 flex flex-wrap gap-2"><Badge variant={listing.kycStatus === "approved" ? "green" : "yellow"}>KYC {listing.kycStatus}</Badge><Badge variant={listing.certified ? "green" : "default"}>{listing.certified ? "Certified" : "Inspection open"}</Badge><Badge variant={listing.warrantyCovered ? "red" : "default"}>{listing.warrantyCovered ? "Warranty" : "No warranty"}</Badge></div>
          </div>
          <div className="flex flex-wrap gap-2">{listing.status === "approved" && <Button variant="secondary" onClick={() => actions.go(`/cars/${listing.slug}`)}>View live ad</Button>}<Button variant="blue" onClick={() => actions.go(`/inspect?listing=${listing.id}`)}>Inspect</Button></div>
        </motion.div>
      ))}</AnimatePresence></motion.div> : <EmptyState icon={Car} title={`No ${status} listings`} text="There are no cars in this status yet." />}</> : <EmptyState icon={Car} title="No listings yet" text="Post a car and it will appear here as pending until an admin approves it." action={<Button onClick={() => actions.go("/sell")}>Post your first ad</Button>} />}
    </InfoPanel>
  );
}

// Auction launch is deferred. Restore this account panel when live bidding returns.
// function AccountBids({ state, actions }) {
//   return <div className="grid gap-6"><InfoPanel title="Active bids and bid history">{state.auctions.map((auction) => { const listing = state.listings.find((item) => item.id === auction.listingId); return <div key={auction.id} className="mb-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><p className="font-black">{listing?.title || auction.id}</p><p className="text-sm font-bold text-slate-500">Current bid {formatBDT(auction.currentBid)} - {auction.status} - {auction.watchers} watchers</p></div><Button variant="blue" onClick={() => actions.go(`/auction/${auction.id}`)}>Open auction</Button></div><div className="mt-3 grid gap-2 md:grid-cols-2">{auction.bidHistory.map((bid, index) => <p key={`${auction.id}-${index}`} className="rounded-lg bg-white p-3 text-sm font-bold">{bid.bidder}: {formatBDT(bid.amount)} - {bid.at}</p>)}</div></div>; })}</InfoPanel></div>;
// }

function AccountWarranty({ state, actions }) {
  const [claim, setClaim] = useState({ listingId: state.warranties[0]?.listingId || state.listings[0]?.id || "", issue: "" });
  const pending = actions.isPending("addClaim");
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <InfoPanel title="Active warranties and claim status">
        {state.warranties.map((warranty) => {
          const listing = state.listings.find((item) => item.id === warranty.listingId);
          return <div key={warranty.id} className="mb-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100"><p className="font-black">{listing?.title}</p><p className="mt-1 text-sm font-bold text-slate-500">{warranty.status} - Escrow {formatBDT(warranty.deposit)} - {warranty.period}</p><div className="mt-3 grid gap-2">{warranty.claims.length ? warranty.claims.map((claimItem) => <p key={claimItem.id} className="rounded-lg bg-white p-3 text-sm font-bold">{claimItem.issue} - {claimItem.status}</p>) : <p className="text-sm font-bold text-slate-500">No active claims.</p>}</div></div>;
        })}
      </InfoPanel>
      <form onSubmit={async (e) => { e.preventDefault(); const saved = await actions.addClaim(claim); if (saved) setClaim({ ...claim, issue: "" }); }} className="h-fit rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-black">Submit warranty claim</h2>
        <div className="mt-5 grid gap-4">
          <SelectField label="Warranty car" value={claim.listingId} onChange={(e) => setClaim({ ...claim, listingId: e.target.value })} required>{state.warranties.map((w) => <option key={w.id} value={w.listingId}>{state.listings.find((x) => x.id === w.listingId)?.title}</option>)}</SelectField>
          <TextArea label="Issue" value={claim.issue} onChange={(e) => setClaim({ ...claim, issue: e.target.value })} placeholder="Describe engine, transmission, electrical, or AC issue..." required />
          <Button type="submit" disabled={pending} aria-busy={pending}>{pending ? <><RefreshCw className="h-4 w-4 animate-spin" /> Submitting...</> : "Submit claim"}</Button>
        </div>
      </form>
    </div>
  );
}

function KycPanel({ state, actions }) {
  const [form, setForm] = useState({ name: state.profile.name, phone: state.profile.phone, nid: "", dob: "", type: "Seller", documents: ["NID front", "NID back", "Selfie holding NID"] });
  const pending = actions.isPending("addKyc");
  return <InfoPanel title="Seller KYC"><form onSubmit={(event) => { event.preventDefault(); actions.addKyc({ ...form, sellerId: state.profile.id }); }}><div className="grid gap-4 md:grid-cols-2"><TextInput label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /><TextInput label="NID number" value={form.nid} onChange={(e) => setForm({ ...form, nid: e.target.value })} required /><TextInput label="Full name as on NID" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /><TextInput label="Date of birth" type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} required /></div><div className="mt-5 grid gap-3 md:grid-cols-3">{form.documents.map((doc) => <div key={doc} className="rounded-xl bg-slate-50 p-5 text-center ring-1 ring-slate-200"><FileCheck2 className="mx-auto h-7 w-7 text-blue-700" /><p className="mt-2 text-sm font-black">{doc}</p><p className="mt-1 text-xs font-bold text-slate-500">Required at verification appointment</p></div>)}</div><Button className="mt-5" type="submit" disabled={pending} aria-busy={pending}>{pending ? <><RefreshCw className="h-4 w-4 animate-spin" /> Submitting...</> : "Submit KYC"}</Button></form></InfoPanel>;
}

function SettingsPanel({ state, locale, setLocale, actions }) {
  const [form, setForm] = useState({ name: state.profile.name, phone: state.profile.phone, language: locale, budgetMin: String(state.profile.budgetMin), budgetMax: String(state.profile.budgetMax), division: state.profile.division });
  const pending = actions.isPending("updateProfile");
  const submit = async (event) => {
    event.preventDefault();
    const saved = await actions.updateProfile({ ...form, budgetMin: numberFrom(form.budgetMin), budgetMax: numberFrom(form.budgetMax) });
    if (saved) setLocale(form.language);
  };
  return <InfoPanel title="Profile, language, and budget"><form onSubmit={submit}><div className="grid gap-4 md:grid-cols-2"><TextInput label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /><TextInput label="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /><SelectField label="Language" value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })}><option value="en">English</option><option value="bn">Bangla</option></SelectField><TextInput label="Budget min" inputMode="numeric" value={form.budgetMin} onChange={(event) => setForm({ ...form, budgetMin: event.target.value })} required /><TextInput label="Budget max" inputMode="numeric" value={form.budgetMax} onChange={(event) => setForm({ ...form, budgetMax: event.target.value })} required /><SelectField label="Division" value={form.division} onChange={(event) => setForm({ ...form, division: event.target.value })}>{cities.map((x) => <option key={x}>{x}</option>)}</SelectField></div><Button className="mt-5" type="submit" variant="blue" disabled={pending} aria-busy={pending}>{pending ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</> : "Save changes"}</Button></form></InfoPanel>;
}

function AdminPage({ state, actions, path }) {
  const tab = path.split("/")[2] || "overview";
  const tabs = [
    ["overview", "Overview"],
    ["users", "Users"],
    ["listings", "Listings"],
    ["sellers", "Seller KYC"],
    ["inspections", "Inspections"],
    // Auction launch is deferred. Restore admin auctions tab when live bidding returns.
    // ["auctions", "Auctions"],
    ["analytics", "Analytics"],
  ];
  const pending = state.listings.filter((x) => x.status === "pending");
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><Badge variant="dark"><LayoutDashboard className="h-3.5 w-3.5 text-red-400" /> Admin</Badge><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Marketplace control center</h1><p className="mt-2 font-medium text-slate-600">Admin remains English-only in V1.</p></div><Button variant="secondary" disabled={actions.isPending("reset")} onClick={() => window.confirm("Restore all demo data? Current marketplace changes will be replaced.") && actions.reset()}>{actions.isPending("reset") ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} {actions.isPending("reset") ? "Restoring..." : "Restore demo data"}</Button></div><div className="mb-6 flex gap-2 overflow-x-auto rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200">{tabs.map(([key, label]) => <button key={key} onClick={() => actions.go(key === "overview" ? "/admin" : `/admin/${key}`)} className={classNames("motion-control min-w-fit rounded-lg px-4 py-2 text-sm font-black", tab === key ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100")}>{label}</button>)}</div><motion.div key={tab} {...panelMotion}>{tab === "overview" && <AdminOverview state={state} pending={pending} />}{tab === "users" && <AdminUsers state={state} actions={actions} />}{tab === "listings" && <AdminListings state={state} actions={actions} />}{tab === "sellers" && <AdminKycQueue state={state} actions={actions} />}{tab === "inspections" && <AdminInspectionQueue state={state} actions={actions} />}{tab === "analytics" && <AdminAnalytics state={state} />}</motion.div></main>;
}

function AdminKycQueue({ state, actions }) {
  return <AdminQueue title="Seller and dealer KYC review" items={state.kycRequests} render={(kyc) => { const pending = actions.isPending("updateItem", kyc.id, "kycRequests"); return <QueueCard title={kyc.name} meta={`${kyc.type} - ${kyc.status}`} actions={<><Button variant={kyc.status === "approved" ? "success" : "blue"} disabled={pending || kyc.status === "approved"} onClick={() => actions.updateItem("kycRequests", kyc.id, { status: "approved" })}>{pending ? "Saving..." : kyc.status === "approved" ? "Approved" : "Approve"}</Button><Button variant="ghost" disabled={pending || kyc.status === "rejected"} onClick={() => actions.updateItem("kycRequests", kyc.id, { status: "rejected" })}>{kyc.status === "rejected" ? "Rejected" : "Reject"}</Button></>} />; }} />;
}

function AdminInspectionQueue({ state, actions }) {
  return <AdminQueue title="Inspection job assignment" items={state.inspections} render={(item) => { const pending = actions.isPending("updateItem", item.id, "inspections"); return <QueueCard title={state.listings.find((x) => x.id === item.listingId)?.title || "Inspection"} meta={`${item.status} - ${item.phone || "phone pending"}`} actions={<><Button variant="secondary" disabled={pending || item.status === "Assigned" || item.status === "Published"} onClick={() => actions.updateItem("inspections", item.id, { status: "Assigned" })}>{pending ? "Saving..." : item.status === "Assigned" ? "Assigned" : "Assign"}</Button><Button variant={item.status === "Published" ? "success" : "blue"} disabled={pending || item.status === "Published"} onClick={() => actions.updateItem("inspections", item.id, { status: "Published" })}>{pending ? "Saving..." : item.status === "Published" ? "Published" : "Publish"}</Button></>} />; }} />;
}

function AdminListings({ state, actions }) {
  const [status, setStatus] = useState("pending");
  const counts = {
    pending: state.listings.filter((listing) => listing.status === "pending").length,
    approved: state.listings.filter((listing) => listing.status === "approved").length,
    rejected: state.listings.filter((listing) => listing.status === "rejected").length,
  };
  const visible = state.listings.filter((listing) => listing.status === status);
  const deleteButton = (listing) => {
    const pending = actions.isPending("deleteListing", listing.id);
    return <Button variant="ghost" className="text-red-700 hover:bg-red-50" disabled={pending} aria-busy={pending} onClick={() => window.confirm(`Delete ${listing.title} permanently? This cannot be undone.`) && actions.deleteListing(listing.id)}>{pending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} {pending ? "Deleting..." : "Delete"}</Button>;
  };

  return (
    <InfoPanel title="Listing moderation">
      <StatusTabs value={status} onChange={setStatus} tabs={[["pending", "Pending approval"], ["approved", "Approved listings"], ["rejected", "Rejected"]]} counts={counts} />
      <motion.div layout className="mt-5 grid gap-3">
        {visible.length === 0 && <EmptyState icon={status === "approved" ? CheckCircle2 : ClipboardCheck} title={`No ${status} listings`} text={status === "pending" ? "New seller submissions will appear here for review." : `There are currently no ${status} listings.`} />}
        <AnimatePresence initial={false} mode="popLayout">{visible.map((listing) => (
          <motion.div layout="position" {...itemMotion} key={listing.id} className="flex flex-col justify-between gap-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100 lg:flex-row lg:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <img src={listing.media?.[0] || "https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=400&auto=format&fit=crop"} alt="" className="h-16 w-20 flex-none rounded-lg object-cover" />
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-black">{listing.title}</p><Badge variant={status === "approved" ? "green" : status === "pending" ? "yellow" : "red"}>{status}</Badge>{listing.certified && <Badge variant="green"><BadgeCheck className="h-3.5 w-3.5" /> Certified</Badge>}</div><p className="mt-1 text-sm font-bold text-slate-500">{listing.sellerName} - {listing.city} - {formatBDT(listing.price)}</p></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {status === "pending" && <><Button variant="blue" disabled={actions.isPending("updateItem", listing.id, "listings")} onClick={() => actions.updateItem("listings", listing.id, { status: "approved", verifiedSeller: true })}>{actions.isPending("updateItem", listing.id, "listings") ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} {actions.isPending("updateItem", listing.id, "listings") ? "Publishing..." : "Approve & publish"}</Button><Button variant="ghost" disabled={actions.isPending("updateItem", listing.id, "listings")} onClick={() => actions.updateItem("listings", listing.id, { status: "rejected" })}>Reject</Button></>}
              {status === "approved" && <><Button variant="secondary" onClick={() => actions.go(`/cars/${listing.slug}`)}>View live ad</Button>{listing.certified ? <Button variant="success" disabled><BadgeCheck className="h-4 w-4" /> Certified</Button> : Number(listing.inspectionReport?.overall || 0) >= 70 ? <Button variant="secondary" disabled={actions.isPending("updateItem", listing.id, "listings")} aria-busy={actions.isPending("updateItem", listing.id, "listings")} onClick={() => actions.updateItem("listings", listing.id, { certified: true, verifiedSeller: true })}>{actions.isPending("updateItem", listing.id, "listings") ? <><RefreshCw className="h-4 w-4 animate-spin" /> Certifying...</> : <><ShieldCheck className="h-4 w-4" /> Certify listing</>}</Button> : <Button variant="secondary" onClick={() => actions.go(`/inspect?listing=${listing.id}`)}><ClipboardCheck className="h-4 w-4" /> Inspection required</Button>}</>}
              {status === "rejected" && <Button variant="secondary" disabled={actions.isPending("updateItem", listing.id, "listings")} onClick={() => actions.updateItem("listings", listing.id, { status: "pending" })}>{actions.isPending("updateItem", listing.id, "listings") ? "Moving..." : "Return to review"}</Button>}
              {deleteButton(listing)}
            </div>
          </motion.div>
        ))}</AnimatePresence>
      </motion.div>
    </InfoPanel>
  );
}

function StatusTabs({ value, onChange, tabs, counts }) {
  return <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-3" role="tablist">{tabs.map(([key, label]) => <motion.button layout key={key} type="button" role="tab" aria-selected={value === key} onClick={() => onChange(key)} className={classNames("motion-control inline-flex min-w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-black", value === key ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}><span>{label}</span><motion.span layout className={classNames("rounded-md px-1.5 py-0.5 text-xs", value === key ? "bg-white/15 text-white" : "bg-white text-slate-500")}>{counts[key] || 0}</motion.span></motion.button>)}</div>;
}

function AdminUsers({ state, actions }) {
  const roles = ["buyer", "seller", "dealer", "admin"];
  return (
    <InfoPanel title="Users and roles">
      {state.users.length === 0 ? <EmptyState icon={UserRound} title="No users loaded" text="Users appear here after they sign into the app." /> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead><tr>{["User", "Email", "Role", "Verified", "Created"].map((head) => <th key={head} className="bg-slate-950 p-4 text-white first:rounded-l-lg last:rounded-r-lg">{head}</th>)}</tr></thead>
            <tbody>
              {state.users.map((user) => (
                <tr key={user.id}>
                  <td className="border-b border-slate-100 p-4 font-black">{user.name || "User"}</td>
                  <td className="border-b border-slate-100 p-4 font-bold text-slate-600">{user.email || "No email"}</td>
                  <td className="border-b border-slate-100 p-4">
                    <select value={roles.includes(user.role) ? user.role : "buyer"} disabled={actions.isPending("updateRole", user.id)} onChange={(event) => actions.updateRole(user.id, event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-wait disabled:opacity-60">
                      {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </td>
                  <td className="border-b border-slate-100 p-4"><Badge variant={user.verified ? "green" : "yellow"}>{user.verified ? "Verified" : "Pending"}</Badge></td>
                  <td className="border-b border-slate-100 p-4 font-bold text-slate-500">{user.createdAt ? dateShort(user.createdAt) : "Unknown"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </InfoPanel>
  );
}

function AdminOverview({ state, pending }) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Listings" value={state.listings.length} icon={Car} />
        <StatCard label="Pending" value={pending.length} icon={Clock3} tone="yellow" />
        <StatCard label="KYC" value={state.kycRequests.length} icon={LockKeyhole} tone="green" />
        {/* Auction launch is deferred. Restore this admin stat when live bidding returns. */}
        {/* <StatCard label="Auctions" value={state.auctions.length} icon={Gavel} tone="purple" /> */}
        <StatCard label="Claims" value={state.warranties.reduce((sum, w) => sum + w.claims.length, 0)} icon={WalletCards} tone="red" />
        <StatCard label="Escrow" value={formatBDT(state.warranties.reduce((sum, w) => sum + w.deposit, 0))} icon={Banknote} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <InfoPanel title="Moderation priorities"><Checklist items={["Review pending listings and seller declarations", "Approve or reject KYC requests", "Assign inspection jobs to partner garages", "Publish reports before certification"]} /></InfoPanel>
        {/* Auction launch is deferred. Restore this admin panel when live bidding returns. */}
        {/* <InfoPanel title="Auction controls"><Checklist items={["Monitor reserve price", "Apply anti-sniping extension", "Declare winner", "Mark deposit status"]} /></InfoPanel> */}
        <InfoPanel title="Operational queues"><Checklist items={["Warranty claims", "Finance leads", "Document deletion requests", "Dealer verification"]} /></InfoPanel>
      </div>
    </div>
  );
}

function AdminAnalytics({ state }) {
  const approved = state.listings.filter((listing) => listing.status === "approved").length;
  const certified = state.listings.filter((listing) => listing.certified).length;
  const leads = state.enquiries.length;
  const totalViews = state.listings.reduce((sum, listing) => sum + listing.views, 0);
  const cityRows = cities.map((city) => ({ city, listings: state.listings.filter((listing) => listing.city === city).length })).filter((row) => row.listings > 0);
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Traffic views" value={totalViews.toLocaleString()} icon={Search} />
        <StatCard label="Approved listings" value={approved} icon={CheckCircle2} tone="green" />
        <StatCard label="Certified share" value={`${Math.round((certified / Math.max(1, approved)) * 100)}%`} icon={ShieldCheck} tone="yellow" />
        <StatCard label="Funnel leads" value={leads} icon={MessageSquare} tone="red" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <InfoPanel title="Traffic and conversion analytics">
          <div className="grid gap-3">{[["Search to listing view", "62%"], ["Listing view to enquiry", `${Math.max(8, leads + 12)}%`], ["Inspection CTA clicks", "24%"], ["Finance leads", state.enquiries.filter((lead) => lead.listingId === "finance").length]].map(([label, value]) => <div key={label} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><p className="font-black">{label}</p><p className="text-xl font-black text-blue-700">{value}</p></div>)}</div>
        </InfoPanel>
        <InfoPanel title="Supply by city">
          {cityRows.map((row) => <div key={row.city} className="mb-3"><div className="flex justify-between text-sm font-black"><span>{row.city}</span><span>{row.listings}</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-700" style={{ width: `${Math.max(12, row.listings * 25)}%` }} /></div></div>)}
        </InfoPanel>
      </div>
    </div>
  );
}

function AdminQueue({ title, items, render }) {
  return <InfoPanel title={title}>{items.length === 0 ? <p className="text-sm font-bold text-slate-500">No records yet.</p> : <motion.div layout className="grid gap-3"><AnimatePresence initial={false} mode="popLayout">{items.map((item) => <motion.div layout="position" {...itemMotion} key={item.id}>{render(item)}</motion.div>)}</AnimatePresence></motion.div>}</InfoPanel>;
}

function QueueCard({ title, meta, actions }) {
  return <div className="motion-card flex flex-col justify-between gap-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100 lg:flex-row lg:items-center"><div><p className="font-black">{title}</p><p className="text-sm font-bold text-slate-500">{meta}</p></div><div className="flex flex-wrap gap-2">{actions}</div></div>;
}

function LegalPage({ slug, actions }) {
  const title = slug.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
  if (slug === "data-deletion") return <DataDeletionPage actions={actions} />;
  if (slug === "about") return <AboutPage />;
  const bnCopy = {
    "privacy-policy": "BanglaWheel অ্যাকাউন্ট, লিস্টিং, KYC, এনকোয়ারি এবং লেনদেন-সংক্রান্ত তথ্য শুধু মার্কেটপ্লেস পরিচালনা, ট্রাস্ট সিগন্যাল যাচাই, জালিয়াতি প্রতিরোধ এবং ক্রেতা-বিক্রেতাকে সহায়তার জন্য ব্যবহার করে।",
    "terms-of-service": "ব্যবহারকারীকে সঠিক গাড়ির তথ্য দিতে হবে, গাড়ি বিক্রির অধিকার থাকতে হবে, এবং বুঝতে হবে যে ইনস্পেকশন, ওয়ারেন্টি, ফিন্যান্সিং ও KYC ইন্টিগ্রেশন প্রোটোটাইপ পর্যায়ে আছে।",
  };
  return <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8"><Badge variant="dark">Legal</Badge><h1 className="mt-5 text-4xl font-black">{title}</h1><div className="mt-8 grid gap-6 md:grid-cols-2"><InfoPanel title="English"><p className="text-lg font-medium leading-9 text-slate-700">{legalCopy[slug]}</p></InfoPanel><InfoPanel title="বাংলা"><p className="text-lg font-medium leading-9 text-slate-700">{bnCopy[slug]}</p></InfoPanel></div></main>;
}

function DataDeletionPage({ actions }) {
  const [form, setForm] = useState({ email: "", phone: "", scope: "All account data", reason: "" });
  const pending = actions.isPending("submitLead");
  const submit = async (event) => {
    event.preventDefault();
    const saved = await actions.submitLead({ listingId: "data-deletion", listingTitle: "Data deletion request", sellerName: "BanglaWheel Privacy Desk", sellerPhone: "", buyerName: form.email, buyerPhone: form.phone, message: `${form.scope}${form.reason ? ` - ${form.reason}` : ""}` });
    if (saved) setForm({ email: "", phone: "", scope: "All account data", reason: "" });
  };
  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <Badge variant="dark">Legal</Badge>
      <h1 className="mt-5 text-4xl font-black">Data Deletion Request</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black">Request form</h2>
          <div className="mt-5 grid gap-4">
            <TextInput label="Account email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" required />
            <TextInput label="Phone number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="01XXXXXXXXX" required />
            <SelectField label="Data to delete" value={form.scope} onChange={(event) => setForm({ ...form, scope: event.target.value })}><option>All account data</option><option>Saved cars and alerts</option><option>KYC draft documents</option><option>Enquiries and leads</option></SelectField>
            <TextArea label="Reason" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Optional" />
            <Button type="submit" disabled={pending} aria-busy={pending}>{pending ? <><RefreshCw className="h-4 w-4 animate-spin" /> Submitting...</> : "Submit request"}</Button>
          </div>
        </form>
        <InfoPanel title="বাংলা সারাংশ"><p className="font-medium leading-7 text-slate-700">আপনার ফোন নম্বর এবং ইমেইল দিয়ে সেভড কার, এনকোয়ারি, KYC ড্রাফট এবং নোটিফিকেশন প্রেফারেন্স মুছে ফেলার অনুরোধ করা যাবে। প্রোডাকশনে এটি সাপোর্ট টিকিট তৈরি করবে।</p></InfoPanel>
      </div>
    </main>
  );
}

function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <Badge variant="dark">Company</Badge>
      <h1 className="mt-5 text-4xl font-black">About BanglaWheel</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <InfoPanel title="Company info"><p className="font-medium leading-7 text-slate-700">{legalCopy.about}</p></InfoPanel>
        <InfoPanel title="Registered address"><p className="font-bold leading-7 text-slate-700">House 12, Road 7, Banani, Dhaka 1213, Bangladesh</p><p className="mt-3 text-sm font-bold text-slate-500">Prototype address for launch planning.</p></InfoPanel>
        <InfoPanel title="Trade licence"><p className="font-bold leading-7 text-slate-700">Trade Licence: BW-DHK-2026-001</p><p className="mt-3 text-sm font-bold text-slate-500">TIN / VAT fields are prepared for production data.</p></InfoPanel>
      </div>
    </main>
  );
}

function ExtensionPage() {
  return <main className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 lg:px-8"><Badge variant="purple">Future extension</Badge><h1 className="mt-5 text-4xl font-black">Auto parts marketplace</h1><p className="mt-3 font-medium leading-7 text-slate-600">Auto parts remain available as a future marketplace extension, while the main prototype now focuses on the PDF's trust-first vehicle marketplace scope.</p></main>;
}

function ContactModal({ state, actions }) {
  const listing = state.contactListing;
  const [form, setForm] = useState({ name: state.profile.name, phone: state.profile.phone, message: "I am interested in this car. Please contact me with availability and final price." });
  const pending = actions.isPending("submitLead");
  useEffect(() => {
    if (!listing) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !pending) actions.openContact(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [actions, listing, pending]);
  return <AnimatePresence>{listing && <motion.div {...backdropMotion} className="fixed inset-0 z-[100] bg-slate-950/70 p-4 backdrop-blur-sm" onClick={() => !pending && actions.openContact(null)}><motion.form {...modalMotion} role="dialog" aria-modal="true" aria-labelledby="contact-modal-title" onSubmit={(e) => { e.preventDefault(); actions.submitLead({ listingId: listing.id, listingTitle: listing.title, sellerName: listing.sellerName, sellerPhone: listing.phone, buyerName: form.name, buyerPhone: form.phone, message: form.message }); }} className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="grid md:grid-cols-[0.9fr_1.1fr]"><img src={listing.media[0]} alt={listing.title} className="h-64 w-full object-cover md:h-full" /><div className="p-6"><div className="flex items-start justify-between gap-4"><div><Badge variant="green"><Phone className="h-3.5 w-3.5" /> Seller enquiry</Badge><h3 id="contact-modal-title" className="mt-3 text-2xl font-black text-slate-950">{listing.title}</h3><p className="mt-1 text-sm font-bold text-slate-500">{listing.sellerName} - {listing.city}</p></div><button type="button" disabled={pending} onClick={() => actions.openContact(null)} className="motion-control rounded-full p-2 hover:bg-slate-100 disabled:opacity-50" aria-label="Close enquiry"><X className="h-5 w-5" /></button></div><div className="mt-5 grid gap-3"><TextInput label="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /><TextInput label="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /><TextArea label="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required /></div><div className="mt-5 rounded-xl bg-blue-50 p-4 text-sm font-bold text-blue-900">Seller phone: {listing.phone}. Asking price: {formatBDT(listing.price)}.</div><Button className="mt-5 w-full" type="submit" variant="blue" disabled={pending} aria-busy={pending}>{pending ? <><RefreshCw className="h-4 w-4 animate-spin" /> Sending...</> : "Send enquiry"}</Button></div></div></motion.form></motion.div>}</AnimatePresence>;
}

function VehicleJsonLd({ listing }) {
  const data = { "@context": "https://schema.org", "@type": "Vehicle", name: listing.title, brand: listing.make, model: listing.model, vehicleModelDate: String(listing.year), mileageFromOdometer: `${listing.mileage} KM`, fuelType: listing.fuel, offers: { "@type": "Offer", priceCurrency: "BDT", price: listing.price, availability: "https://schema.org/InStock", areaServed: listing.city } };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

function Toast({ message, onClose }) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => onCloseRef.current(), 3600);
    return () => window.clearTimeout(timer);
  }, [message]);
  const isError = /error|unable|invalid|wrong|failed|missing|required|not authorized|login required|login to|login before/i.test(message);
  return <AnimatePresence>{message && <div className="pointer-events-none fixed inset-0 z-[140] flex items-center justify-center p-4" role="status" aria-live="polite"><motion.div key={message} {...toastMotion} className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl bg-white p-5 shadow-2xl ring-1 ring-slate-200"><div className={classNames("flex h-10 w-10 flex-none items-center justify-center rounded-lg", isError ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600")}>{isError ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><p className="text-xs font-black uppercase text-slate-400">{isError ? "Please check" : "Done"}</p><p className="mt-1 text-sm font-bold leading-6 text-slate-800">{message}</p></div><button type="button" onClick={onClose} className="motion-control rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Dismiss message"><X className="h-4 w-4" /></button></motion.div></div>}</AnimatePresence>;
}

function CookieBanner({ onAccept }) {
  return <motion.div {...toastMotion} className="fixed bottom-4 left-4 right-4 z-[110] mx-auto max-w-4xl rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200 md:flex md:items-center md:justify-between"><p className="text-sm font-bold text-slate-600">BanglaWheel uses cookies/local storage for language preference, saved cars, search alerts, and prototype account state.</p><Button className="mt-3 md:mt-0" onClick={onAccept}>Accept</Button></motion.div>;
}

function Footer({ go }) {
  return <footer className="mt-12 bg-slate-950 text-white"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8"><div><p className="text-2xl font-black">BanglaWheel<span className="text-red-500">.com</span></p><p className="mt-3 text-sm font-medium leading-6 text-slate-300">Verified sellers, inspections, warranty, finance, paperwork, and education for Bangladesh.</p></div>{[["Company", [["About", "/about"], ["Certified", "/certified"], ["Garages", "/garages"]]], ["Legal", [["Privacy Policy", "/privacy-policy"], ["Terms of Service", "/terms-of-service"], ["Data Deletion", "/data-deletion"]]], ["Trust marks", [["KYC.bd placeholder", "/account/documents"], ["Mercantile Islami placeholder", "/warranty"], ["Trade Licence / TIN", "/about"]]]].map(([title, links]) => <div key={title}><p className="font-black">{title}</p><div className="mt-3 grid gap-2">{links.map(([label, path]) => <button key={path} onClick={() => go(path)} className="text-left text-sm font-bold text-slate-300 hover:text-white">{label}</button>)}</div></div>)}</div></footer>;
}
