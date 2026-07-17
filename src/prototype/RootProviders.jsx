"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import en from "../../messages/en.json";
import bn from "../../messages/bn.json";

const LocaleContext = createContext(null);
const messages = { en, bn };

export function RootProviders({ children }) {
  const [locale, setLocaleState] = useState("en");
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem("banglawheel:locale");
      if (stored === "bn" || stored === "en") setLocaleState(stored);
      setStorageReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    document.documentElement.lang = locale;
    document.documentElement.classList.toggle("bn-font", locale === "bn");
    window.localStorage.setItem("banglawheel:locale", locale);
  }, [locale, storageReady]);

  const value = useMemo(() => ({
    locale,
    setLocale: (nextLocale) => setLocaleState(nextLocale === "bn" ? "bn" : "en"),
  }), [locale]);

  return (
    <LocaleContext.Provider value={value}>
      <NextIntlClientProvider locale={locale} messages={messages[locale]} timeZone="Asia/Dhaka">
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useLocaleController() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocaleController must be used inside RootProviders");
  return value;
}
