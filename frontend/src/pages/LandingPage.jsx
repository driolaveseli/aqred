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

// ── Product screenshot frame ─────────────────────────────────────────────────
const ProductShot = ({ src, alt }) => (
  <figure className="rounded-xl border border-gray-200/90 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl shadow-violet-200/50 dark:shadow-black/60 overflow-hidden">
    <div className="flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-700/80 bg-gray-50 dark:bg-gray-900 px-3.5 py-2.5">
      <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
      <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
      <div className="mx-auto flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 text-[11px] font-medium text-gray-400 dark:text-gray-500">
        <Lock size={10} /> Aqred
      </div>
    </div>
    <img src={src} alt={alt} loading="lazy" className="block w-full" />
  </figure>
);

// ── Hero ──────────────────────────────────────────────────────────────────────
const HERO_CAPABILITIES = [
  { icon: Shield,   label: "Role-based access" },
  { icon: Lock,     label: "Two-factor auth" },
  { icon: Activity, label: "Full audit trail" },
  { icon: FileText, label: "CSV export" },
];

const Hero = () => (
  <section className="relative flex flex-col items-center pt-16 bg-white dark:bg-gray-900 overflow-hidden">
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

    <div className="relative max-w-5xl mx-auto px-6 text-center pt-14 pb-16 w-full">
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
      <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-9 leading-relaxed font-normal">
        Aqred gives teams a unified platform to manage employees, customers,
        inventory, orders, and analytics - with role-based access built in.
      </p>

      {/* CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-7">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 active:bg-violet-800 transition-all shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 hover:-translate-y-0.5"
        >
          Get Started <ArrowRight size={16} />
        </Link>
        <Link
          to="/features"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 font-semibold rounded-xl hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50/50 dark:hover:bg-gray-700 transition-all"
        >
          Explore features <ChevronRight size={16} />
        </Link>
      </div>

      {/* Capabilities */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 mb-16 text-xs font-medium text-slate-500 dark:text-slate-400">
        {HERO_CAPABILITIES.map(({ icon: Icon, label }) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <Icon size={13} className="text-violet-500 dark:text-violet-400" />
            {label}
          </span>
        ))}
      </div>

      {/* Product screenshot */}
      <div className="relative max-w-5xl mx-auto">
        <div className="absolute -inset-x-10 top-8 h-64 bg-violet-400/15 dark:bg-violet-600/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative">
          <ProductShot
            src="/hero-dashboard.png"
            alt="Aqred dashboard showing revenue, orders, inventory levels, and team activity at a glance"
          />
        </div>
      </div>
    </div>
  </section>
);

// ── Stats ─────────────────────────────────────────────────────────────────────
const SPECS = [
  { k: "Modules",  v: "9 connected" },
  { k: "Roles",    v: "3 built-in, plus custom" },
  { k: "Security", v: "JWT · bcrypt · 2FA · audit log" },
  { k: "Delivery", v: "Web-based, no install" },
];

const Stats = () => (
  <section className="bg-slate-50 dark:bg-gray-800/30 border-y border-gray-100 dark:border-gray-800">
    <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-4">
      {SPECS.map(({ k, v }, i) => (
        <div
          key={k}
          className={i !== 0 ? "lg:border-l lg:border-gray-200 dark:lg:border-gray-700 lg:pl-6" : ""}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 mb-1.5">{k}</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{v}</p>
        </div>
      ))}
    </div>
  </section>
);

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Users,        title: "Employee Management", desc: "Manage your entire workforce - departments, positions, salaries, and employment status - all in one place.", gradient: "from-violet-500 to-purple-600" },
  { icon: UserCheck,    title: "Customer Management", desc: "A complete customer directory with contact details, company info, and a full history of linked orders.", gradient: "from-blue-500 to-indigo-600" },
  { icon: Package,      title: "Product & Inventory", desc: "Track your catalog in real time. Monitor stock levels, manage SKUs, and catch low inventory early.", gradient: "from-emerald-500 to-teal-600" },
  { icon: ShoppingCart, title: "Order Management",    desc: "Create and manage orders end-to-end - link customers and employees, track every status change.", gradient: "from-amber-500 to-orange-500" },
  { icon: FileText,     title: "Invoices & Payments", desc: "Track invoices, manage payment status, and keep a clear financial picture across all transactions.", gradient: "from-rose-500 to-pink-600" },
  { icon: BarChart2,    title: "Reports & Analytics", desc: "Interactive dashboards with charts for revenue, orders, and customer trends. Export anything to CSV.", gradient: "from-violet-500 to-indigo-600" },
  { icon: Activity,     title: "Activity Feed",       desc: "A real-time log of every significant action - who did what, when, and from which IP address.", gradient: "from-cyan-500 to-blue-600" },
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
    desc: "Add employees and assign roles - Admin, Manager, or Employee - so each person sees exactly what they need.",
  },
  {
    step: "03",
    title: "Run your operations",
    desc: "Add customers, products, and orders. Track performance, review analytics, and export reports - all from one dashboard.",
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
        {/* Connecting dashed line - desktop */}
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
  { icon: CheckCircle,  title: "Right access, every time", desc: "Role-based permissions ensure each team member sees exactly what they need - nothing more." },
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
            platform - without the complexity of enterprise software.
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

        {/* Right - roles card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-lg shadow-gray-100/80 dark:shadow-black/30">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-slate-50/80 dark:bg-gray-900/40">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              Access roles - who sees what
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
            Register with your company name and your workspace is ready. No installation,
            no configuration - just a clean system to run your operations from.
          </SectionBody>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-violet-700 font-bold rounded-xl hover:bg-violet-50 active:bg-violet-100 transition-colors shadow-xl shadow-violet-900/25"
            >
              Create your account <ArrowRight size={16} />
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
