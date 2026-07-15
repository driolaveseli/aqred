import { Link } from "react-router-dom";
import {
  Users, UserCheck, Package, ShoppingCart,
  BarChart2, Shield, ArrowRight, CheckCircle,
  TrendingUp, Lock, Layers, ChevronRight,
  FileText, Activity,
} from "lucide-react";
import PublicNavbar from "../components/PublicNavbar";
import PublicFooter from "../components/PublicFooter";

// ── Shared primitives ─────────────────────────────────────────────────────────
const SectionLabel = ({ children, inverted = false }) => (
  <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5 border ${
    inverted
      ? "bg-white/10 border-white/20"
      : "bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800"
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${inverted ? "bg-white" : "bg-violet-500"}`} />
    <span className={`text-[11px] font-bold uppercase tracking-[0.12em] ${
      inverted ? "text-white/80" : "text-violet-600 dark:text-violet-400"
    }`}>
      {children}
    </span>
  </div>
);

const SectionHeading = ({ children, center = false }) => (
  <h2 className={`text-3xl sm:text-4xl font-extrabold leading-[1.15] tracking-tight mb-5 text-slate-900 dark:text-white ${center ? "text-center" : ""}`}>
    {children}
  </h2>
);

const SectionBody = ({ children, center = false, inverted = false, className = "" }) => (
  <p className={`text-[15px] leading-relaxed ${center ? "mx-auto text-center" : ""} ${
    inverted ? "text-violet-100/90" : "text-slate-500 dark:text-slate-400"
  } ${className}`}>
    {children}
  </p>
);

// ── Dashboard preview mockup ──────────────────────────────────────────────────
const DashboardPreview = () => (
  <div className="w-full max-w-2xl mx-auto rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xl shadow-violet-200/50 dark:shadow-black/60 bg-white dark:bg-gray-800 select-none">
    {/* Browser chrome */}
    <div className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2.5 flex items-center gap-3">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
      </div>
      <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-1 text-xs text-gray-400 dark:text-gray-500 text-center max-w-xs mx-auto font-mono">
        aqred.app/dashboard
      </div>
    </div>

    {/* App shell */}
    <div className="flex" style={{ height: 300 }}>
      {/* Sidebar */}
      <div className="w-36 bg-slate-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-700 flex flex-col p-3 shrink-0">
        <div className="flex items-center gap-1.5 mb-5 px-1">
          <div className="w-5 h-5 bg-violet-600 rounded-md flex items-center justify-center">
            <span className="text-white text-[9px] font-black">A</span>
          </div>
          <span className="text-xs font-extrabold text-slate-800 dark:text-white">
            Aq<span className="text-violet-600">red</span>
          </span>
        </div>
        {[
          { label: "Dashboard", active: true },
          { label: "Employees", active: false },
          { label: "Customers", active: false },
          { label: "Products",  active: false },
          { label: "Orders",    active: false },
          { label: "Reports",   active: false },
        ].map(({ label, active }) => (
          <div key={label} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium mb-0.5 ${
            active
              ? "bg-violet-600 text-white shadow-sm"
              : "text-gray-400 dark:text-gray-500"
          }`}>
            {label}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 overflow-hidden bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-white">Good morning, Admin</p>
            <p className="text-[10px] text-gray-400">Thursday, June 12, 2025</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <span className="text-[9px] font-bold text-violet-600">A</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: "Employees", value: "24",  trend: "+2",  color: "violet" },
            { label: "Customers", value: "138", trend: "+12", color: "blue" },
            { label: "Products",  value: "56",  trend: "+5",  color: "emerald" },
            { label: "Orders",    value: "89",  trend: "+8",  color: "amber" },
          ].map(({ label, value, trend, color }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-700/60 rounded-lg p-2 border border-gray-100 dark:border-gray-600/40">
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
              <p className={`text-sm font-extrabold leading-none mb-0.5 ${
                color === "violet"  ? "text-violet-600 dark:text-violet-400" :
                color === "blue"    ? "text-blue-600 dark:text-blue-400" :
                color === "emerald" ? "text-emerald-600 dark:text-emerald-400" :
                "text-amber-600 dark:text-amber-400"
              }`}>{value}</p>
              <p className="text-[8px] text-emerald-500 font-semibold">{trend} this mo.</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-3 border border-gray-100 dark:border-gray-600/40" style={{ height: 128 }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-slate-600 dark:text-gray-400">Revenue Overview</p>
            <div className="flex gap-1">
              {["1M","3M","1Y"].map((t, i) => (
                <span key={t} className={`text-[8px] px-1.5 py-0.5 rounded font-medium ${
                  i === 2 ? "bg-violet-600 text-white" : "text-gray-400 dark:text-gray-500"
                }`}>{t}</span>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-0.5" style={{ height: 64 }}>
            {[38, 55, 42, 68, 50, 82, 58, 75, 60, 88, 70, 95].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm" style={{
                height: `${h}%`,
                background:
                  i === 11 ? "linear-gradient(180deg,#7c3aed,#6d28d9)" :
                  i >= 9   ? "rgba(139,92,246,0.45)" :
                             "rgba(221,214,254,0.6)",
              }} />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            {["J","F","M","A","M","J","J","A","S","O","N","D"].map((m, i) => (
              <span key={i} className="text-[7px] text-gray-300 dark:text-gray-600 flex-1 text-center">{m}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ── Hero ──────────────────────────────────────────────────────────────────────
const FEATURE_PILLS = [
  "Employee Management",
  "Analytics & Reports",
  "Role-Based Access",
  "Two-Factor Auth",
  "CSV Export",
];

const AVATARS = [
  { bg: "bg-violet-500", letter: "A" },
  { bg: "bg-blue-500",   letter: "M" },
  { bg: "bg-emerald-500",letter: "J" },
  { bg: "bg-amber-500",  letter: "S" },
  { bg: "bg-rose-500",   letter: "R" },
];

const Hero = () => (
  <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 bg-white dark:bg-gray-900 overflow-hidden">
    {/* Dot grid */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: "radial-gradient(circle, rgba(139,92,246,0.09) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    />
    {/* Multi-layer radial gradient */}
    <div
      className="absolute top-0 left-0 right-0 h-[640px] pointer-events-none"
      style={{
        background: [
          "radial-gradient(ellipse 88% 58% at 50% 0%, rgba(139,92,246,0.14) 0%, transparent 65%)",
          "radial-gradient(ellipse 38% 28% at 12% 4%, rgba(99,102,241,0.08) 0%, transparent 60%)",
          "radial-gradient(ellipse 38% 28% at 88% 4%, rgba(167,139,250,0.08) 0%, transparent 60%)",
        ].join(","),
      }}
    />
    {/* Corner blobs */}
    <div className="absolute top-1/4 -left-48 w-96 h-96 bg-violet-300/10 dark:bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute top-1/3 -right-48 w-80 h-80 bg-indigo-300/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

    <div className="relative max-w-5xl mx-auto px-6 text-center py-20 w-full">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-gray-800 border border-violet-200 dark:border-violet-700/60 rounded-full text-xs font-semibold text-violet-600 dark:text-violet-400 mb-8 shadow-sm shadow-violet-100/60 dark:shadow-none">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
        Web-Based Management Information System
      </div>

      {/* Headline */}
      <h1 className="text-5xl sm:text-6xl md:text-[72px] font-extrabold leading-[1.08] tracking-tight mb-7">
        <span className="text-slate-900 dark:text-white">
          Everything your<br className="hidden sm:block" /> business needs,
        </span>
        <br />
        <span className="relative inline-block">
          <span className="bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-500 bg-clip-text text-transparent">
            in one place.
          </span>
          <span className="absolute -bottom-1 left-1 right-1 h-[3px] rounded-full bg-gradient-to-r from-violet-500 via-violet-400 to-indigo-400 opacity-35" />
        </span>
      </h1>

      {/* Subtext */}
      <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
        Aqred gives teams a unified platform to manage employees, customers,
        inventory, orders, and analytics — with role-based access built in.
      </p>

      {/* Feature pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
        {FEATURE_PILLS.map((f) => (
          <span
            key={f}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm"
          >
            <span className="w-1 h-1 rounded-full bg-violet-500 flex-shrink-0" />
            {f}
          </span>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-7">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 active:bg-violet-800 transition-all shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 hover:-translate-y-0.5"
        >
          Get Started Free <ArrowRight size={16} />
        </Link>
        <Link
          to="/features"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 font-semibold rounded-xl hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50/50 dark:hover:bg-gray-700 transition-all"
        >
          Explore features <ChevronRight size={16} />
        </Link>
      </div>

      {/* Social proof */}
      <div className="flex items-center justify-center gap-3 mb-16">
        <div className="flex -space-x-2">
          {AVATARS.map(({ bg, letter }, i) => (
            <div
              key={i}
              className={`w-7 h-7 rounded-full ${bg} border-2 border-white dark:border-gray-900 flex items-center justify-center flex-shrink-0`}
            >
              <span className="text-white text-[9px] font-bold">{letter}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Built</span>{" "}
          for modern businesses
        </p>
      </div>

      {/* Dashboard preview — with floating stat cards on xl screens */}
      <div className="relative max-w-2xl mx-auto">
        {/* Floating left card — order notification */}
        <div className="hidden xl:flex absolute -left-52 top-[22%] z-20 flex-col gap-0 w-[188px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl shadow-gray-200/70 dark:shadow-black/50 p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
              <ShoppingCart size={14} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-white leading-none mb-0.5">New Order</p>
              <p className="text-[10px] text-slate-400">just now</p>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-gray-700/60 rounded-xl p-2.5">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mb-1.5">#ORD-0089 · Acme Corp</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">$1,240.00</span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-bold">Paid</span>
            </div>
          </div>
        </div>

        {/* Floating right card — revenue */}
        <div className="hidden xl:flex absolute -right-52 top-[10%] z-20 flex-col w-[188px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl shadow-gray-200/70 dark:shadow-black/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Monthly Revenue</p>
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-full">
              <TrendingUp size={9} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">18.4%</span>
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mb-1">$24,580</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-3">vs $20,763 last month</p>
          <div className="flex items-end gap-0.5 h-9">
            {[38,50,42,65,55,72,68,80,74,88,82,95].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm"
                style={{
                  height: `${h}%`,
                  background:
                    i === 11 ? "#7c3aed" :
                    i >= 9   ? "rgba(139,92,246,0.4)" :
                               "rgba(221,214,254,0.5)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Glow behind mockup */}
        <div className="absolute -inset-x-4 top-4 h-56 bg-violet-400/15 dark:bg-violet-600/10 blur-3xl rounded-full pointer-events-none" />
        <DashboardPreview />
      </div>
    </div>
  </section>
);

// ── Stats ─────────────────────────────────────────────────────────────────────
const STATS = [
  { value: "9+",    label: "Business modules",  sub: "All interconnected" },
  { value: "3",     label: "Built-in roles",    sub: "Granular permissions" },
  { value: "2FA",   label: "Two-factor auth",   sub: "TOTP-based security" },
  { value: "100%",  label: "Web-based",         sub: "No installation needed" },
];

const Stats = () => (
  <section className="py-16 bg-slate-50 dark:bg-gray-800/30 border-y border-gray-100 dark:border-gray-800">
    <div className="max-w-5xl mx-auto px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map(({ value, label, sub }) => (
          <div
            key={label}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-violet-100 dark:hover:border-violet-800/50 transition-all duration-200"
          >
            <div className="text-4xl font-black bg-gradient-to-br from-violet-600 to-indigo-600 bg-clip-text text-transparent leading-none mb-2">
              {value}
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Users,        title: "Employee Management", desc: "Manage your entire workforce — departments, positions, salaries, and employment status — all in one place.", gradient: "from-violet-500 to-purple-600" },
  { icon: UserCheck,    title: "Customer Management", desc: "A complete customer directory with contact details, company info, and a full history of linked orders.", gradient: "from-blue-500 to-indigo-600" },
  { icon: Package,      title: "Product & Inventory", desc: "Track your catalog in real time. Monitor stock levels, manage SKUs, and catch low inventory early.", gradient: "from-emerald-500 to-teal-600" },
  { icon: ShoppingCart, title: "Order Management",    desc: "Create and manage orders end-to-end — link customers and employees, track every status change.", gradient: "from-amber-500 to-orange-500" },
  { icon: FileText,     title: "Invoices & Payments", desc: "Track invoices, manage payment status, and keep a clear financial picture across all transactions.", gradient: "from-rose-500 to-pink-600" },
  { icon: BarChart2,    title: "Reports & Analytics", desc: "Interactive dashboards with charts for revenue, orders, and customer trends. Export anything to CSV.", gradient: "from-violet-500 to-indigo-600" },
  { icon: Activity,     title: "Activity Feed",       desc: "A real-time log of every significant action — who did what, when, and from which IP address.", gradient: "from-cyan-500 to-blue-600" },
  { icon: Shield,       title: "Role-Based Access",   desc: "Granular permissions per role. Admins can customize exactly what each role can see and do.", gradient: "from-violet-600 to-purple-700" },
];

const Features = () => (
  <section className="py-28 bg-white dark:bg-gray-900">
    <div className="max-w-6xl mx-auto px-6">
      <div className="max-w-xl mb-16">
        <SectionLabel>Features</SectionLabel>
        <SectionHeading>
          Built for real{" "}
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            business operations
          </span>
        </SectionHeading>
        <SectionBody>
          Every module is designed to work together, giving you a complete operational
          picture without switching between tools.
        </SectionBody>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map(({ icon: Icon, title, desc, gradient }) => (
          <div
            key={title}
            className="group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5
              hover:border-violet-200 dark:hover:border-violet-700
              hover:shadow-xl hover:shadow-violet-100/50 dark:hover:shadow-violet-900/20
              hover:-translate-y-1 transition-all duration-300"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-md`}>
              <Icon size={18} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          to="/features"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors group"
        >
          See full feature breakdown
          <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  </section>
);

// ── How it works ──────────────────────────────────────────────────────────────
const STEPS = [
  {
    step: "01",
    title: "Create your account",
    desc: "Register with your name, email, and company name. Your isolated workspace is ready instantly.",
  },
  {
    step: "02",
    title: "Set up your team",
    desc: "Add employees and assign roles — Admin, Manager, or Employee — so each person sees exactly what they need.",
  },
  {
    step: "03",
    title: "Run your operations",
    desc: "Add customers, products, and orders. Track performance, review analytics, and export reports — all from one dashboard.",
  },
];

const HowItWorks = () => (
  <section className="py-28 bg-slate-50 dark:bg-gray-800/20">
    <div className="max-w-5xl mx-auto px-6">
      <div className="text-center mb-20">
        <SectionLabel>How it works</SectionLabel>
        <SectionHeading center>
          Up and running{" "}
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            in minutes
          </span>
        </SectionHeading>
        <SectionBody center className="max-w-md">
          No complicated setup. Three steps and your whole team is in.
        </SectionBody>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {/* Connecting dashed line — desktop */}
        <div className="hidden md:block absolute top-10 left-[calc(16.67%+3.5rem)] right-[calc(16.67%+3.5rem)] h-px border-t-2 border-dashed border-violet-200 dark:border-violet-800/60" />

        {STEPS.map(({ step, title, desc }) => (
          <div key={step} className="flex flex-col items-center text-center relative group">
            <div className="relative mb-8 z-10">
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-md flex flex-col items-center justify-center
                group-hover:border-violet-200 dark:group-hover:border-violet-700
                group-hover:shadow-lg group-hover:shadow-violet-100/40 dark:group-hover:shadow-violet-900/20
                transition-all duration-300">
                <span className="text-[9px] font-bold text-violet-400 dark:text-violet-500 uppercase tracking-widest mb-0.5">Step</span>
                <span className="text-2xl font-black bg-gradient-to-br from-violet-600 to-indigo-600 bg-clip-text text-transparent leading-none">{step}</span>
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ── Why choose ────────────────────────────────────────────────────────────────
const BENEFITS = [
  { icon: Layers,       title: "Unified platform",     desc: "HR, CRM, inventory, orders, and analytics in one system. No switching tabs, no data silos." },
  { icon: Lock,         title: "Secure by design",     desc: "JWT auth, bcrypt hashing, optional 2FA, and full audit logging on every action." },
  { icon: TrendingUp,   title: "Actionable insights",  desc: "Real-time dashboards and CSV exports that surface the information you actually need." },
  { icon: CheckCircle,  title: "Right access, every time", desc: "Role-based permissions ensure each team member sees exactly what they need — nothing more." },
];

const ROLES = [
  {
    role: "Admin",
    colorClass: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400",
    barClass: "bg-violet-500",
    modules: ["Dashboard", "Employees", "Customers", "Products", "Orders", "Reports", "Administration"],
  },
  {
    role: "Manager",
    colorClass: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
    barClass: "bg-blue-500",
    modules: ["Dashboard", "Employees", "Customers", "Products", "Orders", "Reports"],
  },
  {
    role: "Employee",
    colorClass: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400",
    barClass: "bg-emerald-500",
    modules: ["Dashboard"],
  },
];

const WhyChoose = () => (
  <section className="py-28 bg-white dark:bg-gray-900">
    <div className="max-w-5xl mx-auto px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

        {/* Left */}
        <div>
          <SectionLabel>Why Aqred</SectionLabel>
          <SectionHeading>
            One system.{" "}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Every part of your business.
            </span>
          </SectionHeading>
          <SectionBody className="mb-10">
            Most businesses run on a patchwork of spreadsheets, email threads, and
            disconnected apps. Aqred replaces that chaos with a single, structured
            platform — without the complexity of enterprise software.
          </SectionBody>

          <div className="space-y-2">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-violet-200 dark:shadow-violet-900/30 group-hover:scale-105 transition-transform duration-200">
                  <Icon size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-1 tracking-tight">{title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — roles card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-lg shadow-gray-100/80 dark:shadow-black/30">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-slate-50/80 dark:bg-gray-900/40">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              Access roles — who sees what
            </p>
          </div>

          <div className="p-5 space-y-3">
            {ROLES.map(({ role, colorClass, barClass, modules }) => (
              <div
                key={role}
                className="border border-gray-100 dark:border-gray-700/80 rounded-xl p-4 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colorClass}`}>{role}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className={`h-1.5 w-3 rounded-full ${i < modules.length ? barClass : "bg-gray-100 dark:bg-gray-700"}`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400 tabular-nums font-medium">{modules.length}/7</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {modules.map((m) => (
                    <span key={m} className="text-xs bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 pb-5">
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              Admins can also create custom roles with any combination of module access.
            </p>
          </div>
        </div>

      </div>
    </div>
  </section>
);

// ── CTA ───────────────────────────────────────────────────────────────────────
const CTA = () => (
  <section className="py-24 bg-slate-50 dark:bg-gray-800/20">
    <div className="max-w-4xl mx-auto px-6">
      <div
        className="relative rounded-3xl px-8 sm:px-16 py-20 text-center overflow-hidden"
        style={{ background: "linear-gradient(135deg,#7c3aed 0%,#6d28d9 45%,#4338ca 100%)" }}
      >
        {/* Decorative shapes */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        {/* Subtle dot grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative">
          <SectionLabel inverted>Get started today</SectionLabel>

          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 tracking-tight leading-tight">
            Ready to streamline<br className="hidden sm:block" /> your operations?
          </h2>
          <SectionBody inverted className="mb-10 max-w-lg mx-auto">
            Create your account in seconds. No setup fees, no complicated onboarding —
            just a clean system ready to use from day one.
          </SectionBody>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-violet-700 font-bold rounded-xl hover:bg-violet-50 active:bg-violet-100 transition-colors shadow-xl shadow-violet-900/25"
            >
              Create Free Account <ArrowRight size={16} />
            </Link>
            <Link
              to="/documentation"
              className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-white/25 text-white font-semibold rounded-xl hover:border-white/50 hover:bg-white/10 transition-colors"
            >
              Read the docs
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ── Page ──────────────────────────────────────────────────────────────────────
const LandingPage = () => (
  <div className="font-sans antialiased bg-white dark:bg-gray-900">
    <PublicNavbar />
    <Hero />
    <Stats />
    <Features />
    <HowItWorks />
    <WhyChoose />
    <CTA />
    <PublicFooter />
  </div>
);

export default LandingPage;
