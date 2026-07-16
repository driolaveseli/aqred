import { createContext, useContext, useState, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

const STORAGE_KEY_USER = "mis_user";

const getActiveStorage = () =>
  localStorage.getItem(STORAGE_KEY_USER)   ? localStorage  :
  sessionStorage.getItem(STORAGE_KEY_USER) ? sessionStorage :
  null;

const normaliseBranding = (user) => {
  if (!user) return user;
  if (user.company_name === "AQred") {
    const updated = { ...user, company_name: "Aqred" };
    const storage = getActiveStorage() || localStorage;
    storage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
    return updated;
  }
  return user;
};

const getStoredUser = () => {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      const s = storage.getItem(STORAGE_KEY_USER);
      if (!s) continue;
      const parsed = JSON.parse(s);
      if (!parsed || typeof parsed !== "object" || !parsed.id || !parsed.role) {
        storage.removeItem(STORAGE_KEY_USER);
        continue;
      }
      return normaliseBranding(parsed);
    } catch {
      storage.removeItem(STORAGE_KEY_USER);
    }
  }
  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);

  const login = useCallback((userData, remember = true) => {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch { /* ignore */ }
    [localStorage, sessionStorage].forEach(s => {
      s.removeItem(STORAGE_KEY_USER);
      s.removeItem("mis_token");
    });
    setUser(null);
  }, []);

  const isAuthenticated =
    !!(user && typeof user === "object" && user.id && user.role);

  const hasPermission = useCallback(
    (permission) => Array.isArray(user?.permissions) && user.permissions.includes(permission),
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
