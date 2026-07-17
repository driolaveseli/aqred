import {
  LayoutDashboard, Activity, UserCheck, Package, ShoppingCart, Truck,
  Boxes, TrendingUp, CreditCard, FileText, PieChart, Users, UserCog,
  Shield, ScrollText, Building2,
} from "lucide-react";

// Single source of truth for the app's navigation structure - both the
// Sidebar and the command palette (Cmd+K) read from this, so adding a page
// only means updating it here once.
export const NAV_GROUPS = [
  {
    label: "Dashboard",
    items: [
      { name: "Overview",      path: "/dashboard",      icon: LayoutDashboard, permission: "View Dashboard", keywords: ["home", "overview"] },
      { name: "Activity Feed", path: "/activity-feed",  icon: Activity,        permission: "View Dashboard", keywords: ["activity", "log", "audit"] },
    ],
  },
  {
    label: "Management",
    items: [
      { name: "Customers", path: "/customers", icon: UserCheck,    permission: "Manage Customers", keywords: ["client", "contact"] },
      { name: "Products",  path: "/products",  icon: Package,      permission: "Manage Products",  keywords: ["item", "catalog", "sku"] },
      { name: "Orders",    path: "/orders",    icon: ShoppingCart, permission: "Manage Orders",    keywords: ["purchase", "buy"] },
      { name: "Suppliers", path: "/suppliers", icon: Truck,        permission: "Manage Suppliers", keywords: ["vendor", "partner"] },
    ],
  },
  {
    label: "Finance & Operations",
    items: [
      { name: "Inventory", path: "/inventory", icon: Boxes,      permission: "View Inventory",   keywords: ["stock", "warehouse"] },
      { name: "Sales",     path: "/sales",     icon: TrendingUp,  permission: "View Sales",       keywords: ["revenue", "transaction"] },
      { name: "Invoices",  path: "/invoices",  icon: FileText,    permission: "Manage Invoices",  keywords: ["bill", "payment"] },
      { name: "Payments",  path: "/payments",  icon: CreditCard,  permission: "Manage Payments",  keywords: ["transaction", "receipt"] },
    ],
  },
  {
    label: "Reports & Analytics",
    items: [
      { name: "Customer Reports",  path: "/reports/customers", icon: PieChart,   permission: "View Reports", keywords: ["report", "analytics"] },
      { name: "Employee Reports", path: "/reports/employees", icon: Users,      permission: "View Reports", keywords: ["report", "staff"] },
      { name: "Revenue Analytics", path: "/reports/revenue",   icon: TrendingUp, permission: "View Reports", keywords: ["chart", "analytics"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { name: "Staff",               path: "/staff",       icon: UserCog,    adminOnly: true, keywords: ["employee", "team", "hr"] },
      { name: "Roles & Permissions", path: "/admin/roles", icon: Shield,     adminOnly: true, keywords: ["role", "access", "rbac"] },
      { name: "System Logs",         path: "/admin/logs",  icon: ScrollText, adminOnly: true, keywords: ["audit", "log"] },
    ],
  },
];

export const SUPER_ADMIN_GROUPS = [
  {
    label: "Platform Management",
    items: [
      { name: "Companies",   path: "/super-admin/companies", icon: Building2,   keywords: ["company", "tenant"] },
      { name: "System Logs", path: "/super-admin/logs",      icon: ScrollText,  keywords: ["audit", "log"] },
    ],
  },
];
