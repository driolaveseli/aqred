import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, X, CornerDownLeft, ArrowUp, ArrowDown,
  PlusCircle, Package, UserCheck, UserPlus, LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { NAV_GROUPS, SUPER_ADMIN_GROUPS } from "../../config/navigation";

const CommandPalette = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  const role = user?.role || "employee";

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const canSee = useCallback(
    (item) => (item.adminOnly ? role === "admin" : hasPermission(item.permission)),
    [role, hasPermission]
  );

  const pages = useMemo(() => {
    const groups = role === "super_admin" ? SUPER_ADMIN_GROUPS : NAV_GROUPS;
    return groups.flatMap((g) =>
      g.items.filter(canSee).map((item) => ({
        id: `page-${item.path}`,
        section: "Pages",
        name: item.name,
        icon: item.icon,
        keywords: item.keywords || [],
        path: item.path,
      }))
    );
  }, [role, canSee]);

  const quickActions = useMemo(() => {
    const actions = [];
    if (role !== "super_admin") {
      if (hasPermission("Manage Orders"))
        actions.push({ id: "qa-order", section: "Quick actions", name: "New Order", icon: PlusCircle, keywords: ["create", "order"], path: "/orders" });
      if (hasPermission("Manage Products"))
        actions.push({ id: "qa-product", section: "Quick actions", name: "New Product", icon: Package, keywords: ["create", "product"], path: "/products" });
      if (hasPermission("Manage Customers"))
        actions.push({ id: "qa-customer", section: "Quick actions", name: "New Customer", icon: UserCheck, keywords: ["create", "customer"], path: "/customers" });
      if (role === "admin")
        actions.push({ id: "qa-staff", section: "Quick actions", name: "Add Staff Member", icon: UserPlus, keywords: ["create", "staff", "employee"], path: "/staff" });
    }
    actions.push({ id: "qa-logout", section: "Account", name: "Sign Out", icon: LogOut, keywords: ["logout", "sign out"], path: null, danger: true });
    return actions;
  }, [role, hasPermission]);

  const allItems = useMemo(() => [...quickActions, ...pages], [quickActions, pages]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [allItems, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => { setActiveIndex(0); }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const runItem = useCallback((item) => {
    if (!item) return;
    onClose();
    if (item.id === "qa-logout") {
      logout();
      navigate("/");
      return;
    }
    if (item.section === "Quick actions") {
      navigate(item.path, { state: { openCreate: true } });
      return;
    }
    navigate(item.path);
  }, [navigate, logout, onClose]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runItem(results[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  const sections = [];
  results.forEach((item) => {
    let bucket = sections.find((s) => s.label === item.section);
    if (!bucket) { bucket = { label: item.section, items: [] }; sections.push(bucket); }
    bucket.items.push(item);
  });

  let runningIndex = -1;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/60 border border-gray-200/70 dark:border-gray-800 overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-gray-100 dark:border-gray-800">
          <Search size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages or run a quick action..."
            className="flex-1 py-3.5 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div ref={listRef} className="max-h-[22rem] overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
              No results for "{query}"
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.label} className="mb-1 last:mb-0">
                <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600">
                  {section.label}
                </p>
                {section.items.map((item) => {
                  runningIndex += 1;
                  const index = runningIndex;
                  const Icon = item.icon;
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={item.id}
                      data-index={index}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => runItem(item)}
                      className={[
                        "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                        isActive ? "bg-violet-50 dark:bg-violet-900/25" : "",
                        item.danger
                          ? "text-red-500 dark:text-red-400"
                          : isActive
                            ? "text-violet-700 dark:text-violet-300"
                            : "text-gray-700 dark:text-gray-200",
                      ].join(" ")}
                    >
                      <Icon
                        size={15}
                        className={
                          item.danger
                            ? "text-red-400 flex-shrink-0"
                            : isActive
                              ? "text-violet-500 dark:text-violet-400 flex-shrink-0"
                              : "text-gray-400 dark:text-gray-500 flex-shrink-0"
                        }
                      />
                      <span className="flex-1 truncate">{item.name}</span>
                      {isActive && <CornerDownLeft size={13} className="text-violet-400 dark:text-violet-500 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 text-[11px] text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><ArrowUp size={11} /><ArrowDown size={11} /> Navigate</span>
            <span className="flex items-center gap-1"><CornerDownLeft size={11} /> Select</span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 font-semibold">Esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
