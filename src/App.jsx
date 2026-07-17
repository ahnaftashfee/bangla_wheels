import { useState } from "react";
import heroImage from "./assets/hero.png";
import { ContactModal } from "./components/ContactModal";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Toast } from "./components/ui";
import { seedListings, storageKeys } from "./data/marketplaceData";
import { useRoute } from "./hooks/useRoute";
import { useStoredState } from "./hooks/useStoredState";
import { idFor } from "./lib/marketplace";
import { defaultProfile } from "./lib/navigation";
import { AdminPage } from "./pages/AdminPage";
import { BrowsePage } from "./pages/BrowsePage";
import { DealersPage } from "./pages/DealersPage";
import { GaragePage } from "./pages/GaragePage";
import { HomePage } from "./pages/HomePage";
import { ListingDetailPage } from "./pages/ListingDetailPage";
import { PartsPage } from "./pages/PartsPage";
import { SellPage } from "./pages/SellPage";
import { ToolsPage } from "./pages/ToolsPage";

export default function App() {
  const route = useRoute();
  const [listings, setListings] = useStoredState(storageKeys.listings, seedListings);
  const [savedIds, setSavedIds] = useStoredState(storageKeys.saved, []);
  const [compareIds, setCompareIds] = useStoredState(storageKeys.compare, []);
  const [leads, setLeads] = useStoredState(storageKeys.leads, []);
  const [alerts, setAlerts] = useStoredState(storageKeys.alerts, []);
  const [bookings, setBookings] = useStoredState(storageKeys.bookings, []);
  const [profile, setProfile] = useStoredState(storageKeys.profile, defaultProfile);
  const [applications, setApplications] = useStoredState(storageKeys.dealerApplications, []);
  const [cart, setCart] = useStoredState(storageKeys.cart, []);
  const [orders, setOrders] = useStoredState(storageKeys.orders, []);
  const [sheetChecks, setSheetChecks] = useStoredState(storageKeys.sheetChecks, []);
  const [contactListing, setContactListing] = useState(null);
  const [toast, setToast] = useState("");

  const approvedListings = listings.filter((listing) => listing.status === "approved");
  const currentListingId = route.pathname.startsWith("/listing/") ? route.pathname.replace("/listing/", "") : "";
  const currentListing = listings.find((listing) => listing.id === currentListingId);
  const savedListings = listings.filter((listing) => savedIds.includes(listing.id));
  const compareListings = listings.filter((listing) => compareIds.includes(listing.id));

  const showToast = (message) => setToast(message);

  const toggleSaved = (id) => {
    setSavedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    showToast(savedIds.includes(id) ? "Removed from saved ads." : "Saved to your garage.");
  };

  const toggleCompare = (id) => {
    setCompareIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(-4));
    showToast(compareIds.includes(id) ? "Removed from comparison." : "Added to comparison.");
  };

  const addListing = (listing) => {
    setListings((current) => [listing, ...current]);
    if (listing.sellItForMe) {
      setLeads((current) => [
        {
          id: idFor("sifm"),
          listingId: listing.id,
          listingTitle: listing.title,
          sellerName: listing.sellerName,
          sellerPhone: listing.phone,
          buyerName: "Sell It For Me request",
          buyerPhone: listing.phone,
          message: "Seller requested assisted selling service.",
          status: "new",
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
    }
    showToast("Listing submitted. It is waiting in Admin approval.");
  };

  const addLead = (lead) => {
    setLeads((current) => [lead, ...current]);
    setListings((current) => current.map((listing) => listing.id === lead.listingId ? { ...listing, views: listing.views + 1 } : listing));
    showToast("Lead created and seller phone revealed.");
  };

  const addAlert = (alert) => {
    setAlerts((current) => [alert, ...current]);
    showToast("Search alert created.");
  };

  const toggleAlert = (id) => {
    setAlerts((current) => current.map((alert) => alert.id === id ? { ...alert, active: !alert.active } : alert));
  };

  const addBooking = (booking) => {
    setBookings((current) => [booking, ...current]);
    showToast("Inspection request saved in Admin.");
  };

  const addApplication = (application) => {
    setApplications((current) => [application, ...current]);
    showToast("Dealer application submitted.");
  };

  const checkout = (order) => {
    setOrders((current) => [order, ...current]);
    showToast("Order placed and sent to Admin.");
  };

  const addSheetCheck = (check) => {
    setSheetChecks((current) => [check, ...current]);
    showToast("Auction sheet check completed.");
  };

  const resetDemoData = () => {
    setListings(seedListings);
    setSavedIds([]);
    setCompareIds([]);
    setLeads([]);
    setAlerts([]);
    setBookings([]);
    setApplications([]);
    setCart([]);
    setOrders([]);
    setSheetChecks([]);
    showToast("Demo data restored.");
  };

  let page;
  if (route.pathname.startsWith("/listing/")) {
    page = (
      <ListingDetailPage
        listing={currentListing}
        listings={approvedListings}
        saved={currentListing ? savedIds.includes(currentListing.id) : false}
        compared={currentListing ? compareIds.includes(currentListing.id) : false}
        onSave={toggleSaved}
        onCompare={toggleCompare}
        onContact={setContactListing}
      />
    );
  } else if (route.pathname === "/buy") {
    page = (
      <BrowsePage
        key={route.raw}
        route={route}
        listings={approvedListings}
        savedIds={savedIds}
        compareIds={compareIds}
        onSave={toggleSaved}
        onCompare={toggleCompare}
        onContact={setContactListing}
        onCreateAlert={addAlert}
      />
    );
  } else if (route.pathname === "/sell") {
    page = <SellPage onCreateListing={addListing} defaultImage={heroImage} profile={profile} />;
  } else if (route.pathname === "/dealers") {
    page = <DealersPage applications={applications} onApply={addApplication} />;
  } else if (route.pathname === "/tools") {
    page = (
      <ToolsPage
        key={route.raw}
        route={route}
        listings={approvedListings}
        compareIds={compareIds}
        setCompareIds={setCompareIds}
        bookings={bookings}
        onBookInspection={addBooking}
        alerts={alerts}
        onToggleAlert={toggleAlert}
        sheetChecks={sheetChecks}
        onSheetCheck={addSheetCheck}
      />
    );
  } else if (route.pathname === "/parts") {
    page = <PartsPage cart={cart} setCart={setCart} orders={orders} onCheckout={checkout} />;
  } else if (route.pathname === "/garage") {
    page = (
      <GaragePage
        savedListings={savedListings}
        compareListings={compareListings}
        alerts={alerts}
        leads={leads}
        profile={profile}
        setProfile={setProfile}
        onSave={toggleSaved}
        setCompareIds={setCompareIds}
      />
    );
  } else if (route.pathname === "/admin") {
    page = (
      <AdminPage
        listings={listings}
        setListings={setListings}
        leads={leads}
        setLeads={setLeads}
        bookings={bookings}
        setBookings={setBookings}
        applications={applications}
        setApplications={setApplications}
        orders={orders}
        setOrders={setOrders}
        sheetChecks={sheetChecks}
        resetDemoData={resetDemoData}
      />
    );
  } else {
    page = (
      <HomePage
        listings={approvedListings}
        savedIds={savedIds}
        compareIds={compareIds}
        onSave={toggleSaved}
        onCompare={toggleCompare}
        onContact={setContactListing}
        alertsCount={alerts.length}
        leadsCount={leads.length}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <Header route={route} profile={profile} savedCount={savedIds.length} compareCount={compareIds.length} />
      {page}
      <Footer />
      <ContactModal key={contactListing?.id || "contact-modal"} listing={contactListing} profile={profile} onClose={() => setContactListing(null)} onSubmit={addLead} />
      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}
