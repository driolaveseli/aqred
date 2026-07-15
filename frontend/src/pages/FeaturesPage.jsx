import { Link } from "react-router-dom";
import {
  Users, UserCheck, Package, ShoppingCart,
  DollarSign, FileText, BarChart2,
  Shield, Settings, Lock, Activity, Download,
  ArrowRight, Zap,
} from "lucide-react";
import PublicNavbar from "../components/PublicNavbar";
import PublicFooter from "../components/PublicFooter";

/* ─── Section 1: Core Management cards ─── */
const CoreCard = ({ icon: Icon, title, bullets }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 border-l-4 border-l-violet-500 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:-translate-y-0.5 transition-all">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-violet-50 dark:bg-violet-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon size={19} className="text-violet-600 dark:text-violet-400" />
      </div>
      <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
    </div>
    <ul className="space-y-2">
      {bullets.map((b) => (
        <li key={b} className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="text-violet-500 mt-0.5 flex-shrink-0 font-bold">✓</span>
          {b}
        </li>
      ))}
    </ul>
  </div>
);

/* ─── Section 2: Business Operations cards (horizontal layout) ─── */
const OpsCard = ({ icon: Icon, title, bullets }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 flex gap-5 shadow-sm hover:-translate-y-0.5 transition-all">
    <div className="flex-shrink-0">
      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
        <Icon size={20} className="text-white" />
      </div>
    </div>
    <div className="flex flex-col gap-3 min-w-0">
      <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
      <ul className="space-y-1.5">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="text-violet-400 mt-0.5 flex-shrink-0">•</span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

/* ─── Section 3: Security & Administration cards (dark treatment) ─── */
const SecCard = ({ icon: Icon, title, bullets }) => (
  <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:-translate-y-0.5 transition-all">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
        <Icon size={19} className="text-white" />
      </div>
      <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
    </div>
    <ul className="space-y-2">
      {bullets.map((b) => (
        <li key={b} className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="text-violet-400 mt-0.5 flex-shrink-0">•</span>
          {b}
        </li>
      ))}
    </ul>
  </div>
);

const SECTIONS = [
  {
    label: "Core Management",
    h2Before: "The foundational ",
    h2Accent: "modules",
    subtitle: "that power your day-to-day operations",
    CardComponent: CoreCard,
    features: [
      {
        icon: Users,
        title: "Employee Management",
        bullets: [
          "Add and manage employee profiles with position, department, and salary",
          "Track employment status (Active / Inactive)",
          "Search and filter by department or status",
          "Export employee records to CSV",
        ],
      },
      {
        icon: UserCheck,
        title: "Customer Management",
        bullets: [
          "Maintain a full customer directory with contact and company details",
          "View all orders linked to each customer",
          "Add, edit, and manage customer records",
          "Export customer data to CSV",
        ],
      },
      {
        icon: Package,
        title: "Product & Inventory",
        bullets: [
          "Manage the full product catalog with SKU, category, price, and stock",
          "Real-time stock level visibility",
          "Add and update products through a simple modal form",
          "Export the product list to CSV",
        ],
      },
      {
        icon: ShoppingCart,
        title: "Order Management",
        bullets: [
          "Create orders by linking a customer and employee",
          "Track order status: Pending, Processing, Completed, Cancelled",
          "Update order status in real time",
          "View order totals and creation dates at a glance",
        ],
      },
    ],
  },
  {
    label: "Business Operations",
    h2Before: "Financial tracking and ",
    h2Accent: "business intelligence",
    subtitle: "tools for smarter decisions",
    CardComponent: OpsCard,
    features: [
      {
        icon: DollarSign,
        title: "Sales Tracking",
        bullets: [
          "View sales performance across all orders",
          "Track revenue by period",
          "Compare sales trends over time",
          "Export sales data for further analysis",
        ],
      },
      {
        icon: FileText,
        title: "Invoices & Payments",
        bullets: [
          "Manage invoices linked to orders and customers",
          "Track payment status and outstanding balances",
          "View payment history per customer",
          "Export invoice records to CSV",
        ],
      },
      {
        icon: BarChart2,
        title: "Reports & Analytics",
        bullets: [
          "Interactive dashboard with charts and KPIs",
          "Revenue analytics with trend visualization",
          "Customer and employee performance reports",
          "One-click CSV export for any report",
        ],
      },
      {
        icon: Activity,
        title: "Activity Feed",
        bullets: [
          "Real-time log of all system activity",
          "Filter by action type, user, or date range",
          "Track who did what and when across the platform",
          "Accessible to authorized roles only",
        ],
      },
    ],
  },
  {
    label: "Security & Administration",
    h2Before: "Enterprise-grade ",
    h2Accent: "security controls",
    subtitle: "for admins",
    CardComponent: SecCard,
    features: [
      {
        icon: Shield,
        title: "Role-Based Access Control",
        bullets: [
          "Three built-in roles: Admin, Manager, Employee",
          "Admins can create custom roles with tailored permissions",
          "Module-level permission toggles per role",
          "Protected built-in roles cannot be accidentally modified",
        ],
      },
      {
        icon: Lock,
        title: "Authentication & Security",
        bullets: [
          "JWT-based authentication with 8-hour token expiry",
          "Passwords hashed with bcrypt — never stored as plaintext",
          "Optional two-factor authentication (TOTP/2FA)",
          "Auto-logout on session expiry or unauthorized access",
        ],
      },
      {
        icon: Download,
        title: "System Logs",
        bullets: [
          "Full audit log of all significant actions",
          "Captures user, IP address, action, and timestamp",
          "Filterable by user, action type, or date",
          "Exportable to CSV for compliance or review",
        ],
      },
      {
        icon: Settings,
        title: "System Settings",
        bullets: [
          "Update your account profile and password",
          "Toggle dark mode system-wide",
          "Enable or disable two-factor authentication",
          "Company-level configuration for admins",
        ],
      },
    ],
  },
];

const FeaturesPage = () => (
  <div className="min-h-screen bg-white dark:bg-gray-900 font-sans antialiased">
    <PublicNavbar />
    <main className="pt-16">

      {/* ── Hero ── */}
      <div className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-20 pt-28 text-center">
        {/* pill badge */}
        <div className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Zap size={12} className="text-violet-500" />
          Everything you need, out of the box
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-violet-700 dark:text-violet-300 mb-4 leading-tight tracking-tight">
          All Features
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-base">
          A complete platform for managing every part of your business — no add-ons required
        </p>
      </div>

      {/* ── Sections ── */}
      <div className="max-w-5xl mx-auto px-6 pb-20">

        {SECTIONS.map(({ label, h2Before, h2Accent, subtitle, CardComponent, features }) => (
          <div key={label} className="py-20">
            {/* section label pill */}
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800 text-violet-600 dark:text-violet-400 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
                {label}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-1 tracking-tight">
              {h2Before}{h2Accent}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{subtitle}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((f) => (
                <CardComponent key={f.title} {...f} />
              ))}
            </div>
          </div>
        ))}

        {/* ── CTA ── */}
        <div className="relative bg-gradient-to-br from-violet-600 to-indigo-600 dark:from-violet-700 dark:to-indigo-700 rounded-3xl p-12 text-center overflow-hidden">
          {/* decorative circles */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full pointer-events-none" />
          <div className="absolute -bottom-14 -left-14 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />

          <div className="relative z-10">
            {/* pill badge inside CTA */}
            <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <Zap size={11} />
              No credit card required
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-3">Ready to try it?</h2>
            <p className="text-violet-100 text-sm mb-8 max-w-md mx-auto">
              Create your account and explore every feature — no credit card required.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-7 py-3 bg-white text-violet-700 font-bold rounded-xl hover:bg-violet-50 transition-colors shadow-lg"
            >
              Get Started Free <ArrowRight size={15} />
            </Link>
          </div>
        </div>

      </div>
    </main>
    <PublicFooter />
  </div>
);

export default FeaturesPage;
