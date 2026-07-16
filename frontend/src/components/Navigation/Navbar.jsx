import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, Search, Home, X, Check, CheckCheck, Menu, DollarSign, ShoppingCart, AlertTriangle, Package, TrendingUp, UserCheck, Info } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getNotifications,
  markRead,
  markAllRead,
} from "../../services/notificationsService";


const getNotifStyle = (notif) => {
  const t = (notif.title || '').toLowerCase();
  const type = (notif.type || 'info').toLowerCase();
  if (t.includes('payment') || t.includes('invoice') || t.includes('refund'))
    return { Icon: DollarSign, bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', color: 'text-emerald-500', ring: 'ring-emerald-500/20', accent: 'bg-emerald-500' };
  if (t.includes('sale') || t.includes('order'))
    return { Icon: ShoppingCart, bg: 'bg-blue-500/10 dark:bg-blue-500/15', color: 'text-blue-500', ring: 'ring-blue-500/20', accent: 'bg-blue-500' };
  if (t.includes('stock') || t.includes('low') || type === 'warning')
    return { Icon: AlertTriangle, bg: 'bg-amber-500/10 dark:bg-amber-500/15', color: 'text-amber-500', ring: 'ring-amber-500/20', accent: 'bg-amber-500' };
  if (t.includes('product') || t.includes('inventory'))
    return { Icon: Package, bg: 'bg-orange-500/10 dark:bg-orange-500/15', color: 'text-orange-500', ring: 'ring-orange-500/20', accent: 'bg-orange-500' };
  if (t.includes('employee') || t.includes('staff') || t.includes('user'))
    return { Icon: UserCheck, bg: 'bg-pink-500/10 dark:bg-pink-500/15', color: 'text-pink-500', ring: 'ring-pink-500/20', accent: 'bg-pink-500' };
  if (type === 'success')
    return { Icon: TrendingUp, bg: 'bg-green-500/10 dark:bg-green-500/15', color: 'text-green-500', ring: 'ring-green-500/20', accent: 'bg-green-500' };
  return { Icon: Info, bg: 'bg-violet-500/10 dark:bg-violet-500/15', color: 'text-violet-500', ring: 'ring-violet-500/20', accent: 'bg-violet-500' };
};

const NAV_ITEMS = [
  { label: "Dashboard",        path: "/dashboard",         keywords: ["dashboard", "home", "overview"] },
  { label: "Staff",            path: "/staff",             keywords: ["staff", "employee", "team", "hr", "people", "user", "access"] },
  { label: "Customers",        path: "/customers",         keywords: ["customer", "client", "contact"] },
  { label: "Products",         path: "/products",          keywords: ["product", "item", "catalog", "sku"] },
  { label: "Inventory",        path: "/inventory",         keywords: ["inventory", "stock", "warehouse", "level"] },
  { label: "Suppliers",        path: "/suppliers",         keywords: ["supplier", "vendor", "partner"] },
  { label: "Orders",           path: "/orders",            keywords: ["order", "purchase", "buy"] },
  { label: "Invoices",         path: "/invoices",          keywords: ["invoice", "bill", "payment"] },
  { label: "Sales",            path: "/sales",             keywords: ["sale", "revenue", "transaction"] },
  { label: "Sales Reports",    path: "/reports/sales",     keywords: ["report", "sales", "analytics", "chart"] },
  { label: "Customer Reports", path: "/reports/customers", keywords: ["customer", "report"] },
  { label: "Employee Reports", path: "/reports/employees", keywords: ["employee", "report"] },
  { label: "Revenue Analytics",path: "/reports/revenue",   keywords: ["revenue", "analytics"] },
  { label: "Settings",         path: "/settings",          keywords: ["setting", "profile", "preference", "security"] },
];

const POLL_INTERVAL = 30_000; // 30 seconds

const Navbar = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs]         = useState([]);
  const [search, setSearch]         = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchRef  = useRef(null);
  const notifsRef  = useRef(null);
  const pollRef    = useRef(null);

  const unread = notifs.filter((n) => !n.is_read).length;

  // ── fetch from API ──────────────────────────────────────────────────────────
  const fetchNotifs = useCallback(async () => {
    try {
      const { data } = await getNotifications();
      setNotifs(data);
    } catch {
      // silently ignore — don't crash navbar on network error
    }
  }, []);

  // initial load + polling
  useEffect(() => {
    fetchNotifs();
    pollRef.current = setInterval(fetchNotifs, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchNotifs]);

  // ── read handlers ───────────────────────────────────────────────────────────
  const handleMarkRead = async (id) => {
    try {
      await markRead(id);
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch { /* ignore */ }
  };

  // clicking a notification navigates to its link and marks it read
  const handleNotifClick = (notif) => {
    if (!notif.is_read) handleMarkRead(notif.id);
    setShowNotifs(false);
    if (notif.link) navigate(notif.link);
  };

  // ── search ──────────────────────────────────────────────────────────────────
  const searchResults = search.trim().length > 0
    ? NAV_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.keywords.some((k) => k.includes(search.toLowerCase()))
      )
    : [];

  const handleSearchSelect = (path) => {
    navigate(path);
    setSearch("");
    setShowSearch(false);
  };

  // close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowSearch(false);
      if (notifsRef.current && !notifsRef.current.contains(e.target))
        setShowNotifs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60)   return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const avatarInitials = (user?.name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <header className="h-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 px-4 flex items-center justify-between sticky top-0 z-40 flex-shrink-0 shadow-sm dark:shadow-gray-900">
      {/* Left: hamburger (mobile) + branding (mobile) + search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Aqred wordmark — only visible on mobile where sidebar is hidden */}
        <Link to="/dashboard" className="md:hidden flex items-center gap-1.5">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-black select-none">A</span>
          </div>
          <span className="text-[15px] leading-none select-none">
            <span className="font-extrabold tracking-tight text-slate-800">Aq</span><span className="font-extrabold tracking-tight text-violet-600">red</span>
          </span>
        </Link>

        {/* Search */}
        <div ref={searchRef} className="relative hidden sm:block w-60 lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={15} />
          <input
            type="text"
            placeholder="Search pages..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-400/25 focus:border-violet-300 focus:bg-white dark:focus:bg-gray-800 transition-all"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
          />
          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl shadow-gray-200/60 dark:shadow-gray-900/60 z-50 overflow-hidden">
              {searchResults.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleSearchSelect(item.path)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-2"
                >
                  <Search size={12} className="text-gray-400 flex-shrink-0" />
                  {item.label}
                </button>
              ))}
            </div>
          )}
          {showSearch && search.trim().length > 0 && searchResults.length === 0 && (
            <div className="absolute top-full mt-1.5 left-0 w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl shadow-gray-200/60 dark:shadow-gray-900/60 z-50 px-4 py-3 text-sm text-gray-400 dark:text-gray-500">
              No results for "{search}"
            </div>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        {/* Back to Home */}
        <Link
          to="/"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all group"
        >
          <Home size={13} className="group-hover:text-violet-500 transition-colors" />
          Home
        </Link>

        {/* Notifications */}
        <div ref={notifsRef} className="relative">
          <button
            onClick={() => setShowNotifs((v) => !v)}
            className="relative p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
          >
            <Bell size={19} />
            {unread > 0 && (
              <>
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-400/40 rounded-full animate-ping" />
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold border-[1.5px] border-white shadow-sm">
                  {unread > 9 ? "9+" : unread}
                </span>
              </>
            )}
          </button>

          {showNotifs && (() => {
            const sorted = [...notifs].sort((a, b) => a.is_read - b.is_read || new Date(b.created_at) - new Date(a.created_at));
            const unreadItems = sorted.filter(n => !n.is_read);
            const readItems   = sorted.filter(n =>  n.is_read);

            const NotifRow = ({ n }) => {
              const { Icon, bg, color, accent } = getNotifStyle(n);
              return (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotifClick(n)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleNotifClick(n); } }}
                  className={`w-full text-left flex items-start gap-3.5 px-4 py-3.5 transition-all duration-150 relative group cursor-pointer
                    ${!n.is_read
                      ? 'bg-gradient-to-r from-violet-50/70 via-violet-50/30 to-transparent dark:from-violet-950/30 dark:via-violet-950/10 dark:to-transparent hover:from-violet-100/70 dark:hover:from-violet-950/50'
                      : 'hover:bg-gray-50/70 dark:hover:bg-white/[0.03]'
                    }`}
                >
                  {/* Left accent */}
                  {!n.is_read && (
                    <span className={`absolute left-0 top-3 bottom-3 w-[3px] ${accent} rounded-r-full`} />
                  )}

                  {/* Icon badge */}
                  <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg} ${n.is_read ? 'opacity-40' : ''}`}>
                    <Icon size={16} className={color} />
                    {!n.is_read && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-violet-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <p className={`text-[12.5px] leading-snug
                        ${n.is_read ? 'font-medium text-gray-400 dark:text-gray-600' : 'font-bold text-gray-800 dark:text-gray-100'}`}>
                        {n.title}
                      </p>
                      <span className={`text-[10px] flex-shrink-0 tabular-nums font-medium
                        ${n.is_read ? 'text-gray-400 dark:text-gray-600' : 'text-violet-500 dark:text-violet-400'}`}>
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-relaxed line-clamp-2
                      ${n.is_read ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}>
                      {n.message}
                    </p>
                  </div>

                  {/* Mark-read on hover */}
                  {!n.is_read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                      className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-white dark:bg-gray-800 shadow border border-gray-100 dark:border-gray-700 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      title="Mark as read"
                    >
                      <Check size={10} className="text-gray-400 group-hover:text-green-500" />
                    </button>
                  )}
                </div>
              );
            };

            return (
              <div className="absolute right-0 top-12 w-[23rem] rounded-2xl overflow-hidden z-50
                bg-white dark:bg-[#111318]
                shadow-2xl shadow-violet-500/10 dark:shadow-black/70
                border border-gray-100 dark:border-white/[0.07]">

                {/* ── Header ── */}
                <div className="relative px-5 py-4 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4f46e5 100%)' }}>
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.18)_0%,_transparent_65%)] pointer-events-none" />
                  <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />
                  <div className="absolute -bottom-6 right-20 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />

                  <div className="relative flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                        </div>
                        <span className="text-[9px] font-bold text-green-300 tracking-[0.18em] uppercase">Live</span>
                      </div>
                      <p className="text-[15px] font-bold text-white tracking-tight">Notifications</p>
                      <p className="text-[11px] text-indigo-200 mt-0.5">
                        {unread > 0 ? `${unread} unread · ${notifs.length} total` : "You're all caught up"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {unread > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white
                            bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
                        >
                          <CheckCheck size={12} />
                          All read
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifs(false)}
                        className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── List ── */}
                <div className="max-h-[24rem] overflow-y-auto">
                  {notifs.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                        <Bell size={28} className="text-gray-300 dark:text-gray-600" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">All caught up!</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">No notifications right now</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {unreadItems.length > 0 && (
                        <>
                          <div className="px-4 pt-3 pb-1.5 flex items-center gap-2">
                            <span className="text-[9px] font-black text-violet-500 dark:text-violet-400 tracking-[0.15em] uppercase">Unread</span>
                            <div className="flex-1 h-px bg-violet-100 dark:bg-violet-900/40" />
                            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-violet-500 text-white text-[9px] font-bold flex items-center justify-center">
                              {unreadItems.length}
                            </span>
                          </div>
                          <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                            {unreadItems.map(n => <NotifRow key={n.id} n={n} />)}
                          </div>
                        </>
                      )}
                      {readItems.length > 0 && (
                        <>
                          <div className="px-4 pt-3 pb-1.5 flex items-center gap-2">
                            <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 tracking-[0.15em] uppercase">Earlier</span>
                            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                          </div>
                          <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                            {readItems.map(n => <NotifRow key={n.id} n={n} />)}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* ── Footer ── */}
                {notifs.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/40 dark:bg-white/[0.02]">
                    <button
                      onClick={() => { setShowNotifs(false); navigate('/activity-feed'); }}
                      className="w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors group py-0.5"
                    >
                      View all activity
                      <span className="transition-transform group-hover:translate-x-0.5">→</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* User avatar — full card lives in the sidebar */}
        <button
          onClick={() => navigate("/settings")}
          className="p-1 rounded-full hover:ring-2 hover:ring-violet-200 transition-all group"
          title={user?.name || "Profile & Settings"}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-[11px] font-bold text-white leading-none">{avatarInitials}</span>
          </div>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
