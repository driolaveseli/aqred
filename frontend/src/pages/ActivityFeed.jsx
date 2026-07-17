import { useState, useEffect, useCallback } from "react";
import { useSystem } from "../context/SystemContext";
import { getActivity } from "../services/activityService";
import Pagination from "../components/UI/Pagination";
import EmptyState from "../components/UI/EmptyState";
import PageHeader from "../components/UI/PageHeader";
import {
  Activity,
  UserPlus,
  ShoppingCart,
  Package,
  UserCheck,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Filter,
} from "lucide-react";

const typeConfig = {
  employee: { icon: UserPlus, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
  order: { icon: ShoppingCart, color: "text-violet-500 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20" },
  product: { icon: Package, color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
  customer: { icon: UserCheck, color: "text-green-500 dark:text-emerald-400", bg: "bg-green-50 dark:bg-emerald-900/20" },
  payment: { icon: CreditCard, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  alert: { icon: AlertTriangle, color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" },
  system: { icon: CheckCircle, color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-800" },
};

const FILTERS = ["All", "Orders", "Employees", "Customers", "Products", "Payments", "Alerts"];

const filterMap = {
  All: "All", Orders: "order", Employees: "employee", Customers: "customer",
  Products: "product", Payments: "payment", Alerts: "alert",
};

const timeAgo = (ts) => {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  return `${Math.floor(diff / 86400)}d ago`;
};

const dateGroup = (ts) => {
  const d = new Date(ts);
  const now = new Date();
  const isSameDay = (a, b) => a.toDateString() === b.toDateString();
  if (isSameDay(d, now)) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, yesterday)) return "Yesterday";
  return "Earlier";
};

const ActivityFeed = () => {
  const { t } = useSystem();
  const [activeFilter, setActiveFilter] = useState("All");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { setPage(1); }, [activeFilter]);

  const load = useCallback(async () => {
    try {
      const { data } = await getActivity({ page, limit: pageSize, type: filterMap[activeFilter] });
      setEvents(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, activeFilter]);

  useEffect(() => { load(); }, [load]);

  const grouped = events.reduce((acc, item) => {
    const group = dateGroup(item.timestamp);
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <PageHeader
        title={t("Activity Feed")}
        subtitle={t("Track all system events and user actions in real-time")}
        badges={[{ icon: Activity, label: `${total} ${t("events")}`, tone: "violet" }]}
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 mb-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-1.5 w-full sm:w-fit overflow-x-auto">
        <Filter size={14} className="text-gray-400 dark:text-gray-500 ml-1" />
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
              activeFilter === f
                ? "bg-violet-600 text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {t(f)}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {!loading && (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">{t(date)}</h3>
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                {items.map((activity, idx) => {
                  const cfg = typeConfig[activity.type] || typeConfig.system;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={activity.id}
                      className={`flex items-start gap-4 px-5 py-4 ${
                        idx !== items.length - 1 ? "border-b border-gray-50 dark:border-gray-800/60" : ""
                      }`}
                    >
                      <div className={`w-9 h-9 ${cfg.bg} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon size={16} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-semibold text-gray-900 dark:text-white">{activity.user_name || t("System")}</span>
                          {" "}{activity.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{timeAgo(activity.timestamp)}</p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} flex-shrink-0`}>
                        {t(activity.type)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <EmptyState
              icon={Activity}
              title={t("No activity found")}
              description={activeFilter !== "All" ? t("Try a different filter") : t("Actions across the app will show up here.")}
            />
          )}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
        itemLabel={t("events")}
      />
    </div>
  );
};

export default ActivityFeed;
