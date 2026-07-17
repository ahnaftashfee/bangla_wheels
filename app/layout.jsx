import "./globals.css";
import { RootProviders } from "../src/prototype/RootProviders";

export const metadata = {
  metadataBase: new URL("https://banglawheel.com"),
  title: {
    default: "BanglaWheel - Verified Used Cars in Bangladesh",
    template: "%s - BanglaWheel",
  },
  description: "Bangladesh-first automotive marketplace with verified sellers, inspections, auctions, warranty, financing, and BRTA guidance.",
  openGraph: {
    title: "BanglaWheel",
    description: "Buy, sell, inspect, bid, finance, and protect used cars in Bangladesh.",
    siteName: "BanglaWheel",
    type: "website",
  },
  alternates: {
    languages: {
      en: "/",
      bn: "/?locale=bn",
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
