import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSystemSettings } from "../services/settingsService";
import { translate, isRTL } from "../i18n/translations";

const SystemContext = createContext(null);

const CURRENCY_SYMBOLS = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "CA$", CHF: "CHF ", AUD: "A$",
};

const LANG_CODES = {
  English: "en", Spanish: "es", French: "fr",
  German: "de", Arabic: "ar", Portuguese: "pt", Albanian: "sq",
};

const makeCurrencyFormatter = (currency) => (amount) => {
  const sym = CURRENCY_SYMBOLS[currency] || "$";
  return `${sym}${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;
};

const makeDateFormatter = (dateFormat) => (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d   = new Date(dateStr);
    const pad = (n) => String(n).padStart(2, "0");
    const mm  = pad(d.getMonth() + 1);
    const dd  = pad(d.getDate());
    const yyyy = d.getFullYear();
    if (dateFormat === "DD/MM/YYYY") return `${dd}/${mm}/${yyyy}`;
    if (dateFormat === "YYYY-MM-DD") return `${yyyy}-${mm}-${dd}`;
    return `${mm}/${dd}/${yyyy}`;
  } catch { return String(dateStr); }
};

const loadCached = () => {
  try { return JSON.parse(localStorage.getItem("mis_system") || "null"); }
  catch { return null; }
};
const saveCached = (d) => {
  try { localStorage.setItem("mis_system", JSON.stringify(d)); } catch {}
};

export const SystemProvider = ({ children }) => {
  const cached = loadCached();
  const [settings, setSettings] = useState({
    currency:        cached?.currency        || "USD",
    dateFormat:      cached?.dateFormat      || "MM/DD/YYYY",
    language:        cached?.language        || "English",
    autoBackup:      cached?.autoBackup      ?? true,
    maintenanceMode: cached?.maintenanceMode ?? false,
  });

  const applyLanguage = (lang) => {
    document.documentElement.setAttribute("lang", LANG_CODES[lang] || "en");
    document.documentElement.setAttribute("dir", isRTL(lang) ? "rtl" : "ltr");
  };

  const refresh = useCallback(async () => {
    // Skip if not authenticated — avoids triggering the 401 auto-logout interceptor
    if (!localStorage.getItem("token")) return;
    try {
      const sysRes = await getSystemSettings();
      const next = {
        currency:        sysRes.data.currency        || "USD",
        dateFormat:      sysRes.data.dateFormat       || "MM/DD/YYYY",
        language:        sysRes.data.language         || "English",
        autoBackup:      sysRes.data.autoBackup       === "true",
        maintenanceMode: sysRes.data.maintenanceMode  === "true",
      };
      setSettings(next);
      saveCached(next);
      applyLanguage(next.language);
    } catch { /* ignore — keep cached/defaults */ }
  }, []);

  // Directly update context state without an API call (used by Settings for immediate apply)
  const updateSettings = useCallback((partial) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      saveCached(next);
      if (partial.language !== undefined) applyLanguage(partial.language);
      return next;
    });
  }, []);

  useEffect(() => {
    applyLanguage(settings.language);
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    ...settings,
    formatCurrency: makeCurrencyFormatter(settings.currency),
    formatDate:     makeDateFormatter(settings.dateFormat),
    t: (key) => translate(key, settings.language),
    refresh,
    updateSettings,
  };

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
};

export const useSystem = () => {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error("useSystem must be used within <SystemProvider>");
  return ctx;
};
