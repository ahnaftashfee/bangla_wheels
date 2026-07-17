import {
  Heart,
  Home,
  LayoutDashboard,
  Package,
  Plus,
  Search,
  Store,
  Wrench,
} from "lucide-react";

export const navItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "Buy Cars", path: "/buy", icon: Search },
  { label: "Sell", path: "/sell", icon: Plus },
  { label: "Dealers", path: "/dealers", icon: Store },
  { label: "Tools", path: "/tools", icon: Wrench },
  { label: "Parts", path: "/parts", icon: Package },
  { label: "Saved", path: "/garage", icon: Heart },
  { label: "Admin", path: "/admin", icon: LayoutDashboard },
];

export const defaultProfile = {
  name: "BanglaWheels Founder",
  phone: "01700000000",
  email: "founder@banglawheels.com",
  role: "Founder",
};
