import { useState } from "react";
import { useSystem } from "../context/SystemContext";
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
  employee: { icon: UserPlus, color: "text-blue-500", bg: "bg-blue-50" },
  order: { icon: ShoppingCart, color: "text-violet-500", bg: "bg-violet-50" },
  product: { icon: Package, color: "text-amber-500", bg: "bg-amber-50" },
  customer: { icon: UserCheck, color: "text-green-500", bg: "bg-green-50" },
  payment: { icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-50" },
  alert: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
  system: { icon: CheckCircle, color: "text-gray-500", bg: "bg-gray-100" },
};

const activities = [
  { id: 1, type: "order", user: "John Smith", action: "placed a new order", target: "Order #1042", time: "2 minutes ago", date: "Today" },
  { id: 2, type: "employee", user: "Admin", action: "added new employee", target: "Sarah Connor", time: "15 minutes ago", date: "Today" },
  { id: 3, type: "payment", user: "System", action: "payment received for", target: "Invoice #INV-2024-089", time: "32 minutes ago", date: "Today" },
  { id: 4, type: "product", user: "Admin", action: "updated stock for", target: "Wireless Keyboard", time: "1 hour ago", date: "Today" },
  { id: 5, type: "alert", user: "System", action: "low stock alert triggered for", target: "USB-C Hub (3 remaining)", time: "2 hours ago", date: "Today" },
  { id: 6, type: "customer", user: "Admin", action: "registered new customer", target: "TechCorp Ltd.", time: "3 hours ago", date: "Today" },
  { id: 7, type: "order", user: "Emily Davis", action: "updated status of", target: "Order #1039 → Shipped", time: "5 hours ago", date: "Today" },
  { id: 8, type: "system", user: "System", action: "completed daily backup", target: "Database snapshot saved", time: "6 hours ago", date: "Today" },
  { id: 9, type: "employee", user: "Admin", action: "updated role for", target: "Mike Johnson → Manager", time: "Yesterday", date: "Yesterday" },
  { id: 10, type: "payment", user: "System", action: "payment failed for", target: "Invoice #INV-2024-085", time: "Yesterday", date: "Yesterday" },
  { id: 11, type: "product", user: "Admin", action: "added new product", target: "Ergonomic Chair Pro", time: "Yesterday", date: "Yesterday" },
  { id: 12, type: "customer", user: "Sales Team", action: "updated contact for", target: "GlobalTech Inc.", time: "2 days ago", date: "Earlier" },
];

const FILTERS = ["All", "Orders", "Employees", "Customers", "Products", "Payments", "Alerts"];

const filterMap = {
  All: null,
  Orders: "order",
  Employees: "employee",
  Customers: "customer",
  Products: "product",
  Payments: "payment",
  Alerts: "alert",
};

const ActivityFeed = () => {
  const { t } = useSystem();
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = activities.filter(
    (a) => filterMap[activeFilter] === null || a.type === filterMap[activeFilter]
  );

  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t("Activity Feed")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("Track all system events and user actions in real-time")}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Activity size={16} className="text-violet-500" />
          <span>{activities.length} total events</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 mb-6 bg-white border border-gray-100 rounded-xl p-1.5 w-full sm:w-fit overflow-x-auto">
        <Filter size={14} className="text-gray-400 ml-1" />
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
              activeFilter === f
                ? "bg-violet-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{date}</h3>
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              {items.map((activity, idx) => {
                const cfg = typeConfig[activity.type];
                const Icon = cfg.icon;
                return (
                  <div
                    key={activity.id}
                    className={`flex items-start gap-4 px-5 py-4 ${
                      idx !== items.length - 1 ? "border-b border-gray-50" : ""
                    }`}
                  >
                    <div className={`w-9 h-9 ${cfg.bg} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon size={16} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-900">{activity.user}</span>
                        {" "}{activity.action}{" "}
                        <span className="font-medium text-violet-600">{activity.target}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} flex-shrink-0`}>
                      {activity.type}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
            <Activity size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No activity found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
