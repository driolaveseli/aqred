import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, UserCheck, Package, ShoppingCart,
  BarChart2, Shield, ArrowRight, CheckCircle,
  TrendingUp, Lock, Layers, ChevronRight,
  FileText, Activity,
} from "lucide-react";
import PublicNavbar from "../components/PublicNavbar";
import PublicFooter from "../components/PublicFooter";

// ── Motion helpers ────────────────────────────────────────────────────────────
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Fades / slides its children in the first time they scroll into view.
const Reveal = ({ children, delay = 0, y = 24, className = "", as: Tag = "div" }) => {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setShown(true); io.disconnect(); }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        shown ? "opacity-100 translate-y-0" : "opacity-0"
      } ${className}`}
      style={{ transform: shown ? undefined : `translateY(${y}px)`, transitionDelay: `${shown ? delay : 0}ms` }}
    >
      {children}
    </Tag>
  );
};

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

// ── Hero product showcase ─────────────────────────────────────────────────────
const SHOWCASE = [
  {
    src: "/shot-analytics.png",
    tab: "Analytics",
    alt: "Aqred revenue analytics: total revenue, a multi-month trend chart, orders per month, and revenue by category",
  },
  {
    src: "/shot-orders.png",
    tab: "Orders",
    alt: "Aqred order management: a filterable list of orders with customer, item count, total, and status",
  },
  {
    src: "/shot-products.png",
    tab: "Products",
    alt: "Aqred product catalog: stock levels, SKUs, categories, pricing, and inventory value",
  },
];

const HeroShowcase = () => {
  const [i, setI] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const hovering = useRef(false);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => {
      if (!hovering.current) setI((v) => (v + 1) % SHOWCASE.length);
    }, 5200);
    return () => clearInterval(t);
  }, [reduced]);

  const onMove = (e) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: py * -3.5, y: px * 5 });
  };
  const onLeave = () => { hovering.current = false; setTilt({ x: 0, y: 0 }); };

  return (
    <div
      className="relative mx-auto w-full max-w-5xl [perspective:1600px]"
      onMouseEnter={() => { hovering.current = true; }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {/* soft glow behind */}
      <div className="pointer-events-none absolute -inset-x-16 -top-8 bottom-10 rounded-[44px] bg-gradient-to-tr from-violet-400/25 via-fuchsia-300/15 to-indigo-400/25 blur-3xl dark:from-violet-600/20 dark:via-fuchsia-700/10 dark:to-indigo-600/20" />

      <div className={reduced ? "" : "animate-float"}>
        <figure
          className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_40px_90px_-25px_rgba(76,29,149,0.30)] transition-transform duration-300 ease-out will-change-transform dark:border-gray-700 dark:bg-gray-800 dark:shadow-[0_40px_90px_-25px_rgba(0,0,0,0.65)]"
          style={tilt.x || tilt.y ? { transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` } : undefined}
        >
          {/* browser chrome */}
          <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700/80 dark:bg-gray-900">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
            <div className="mx-auto flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1 text-[11px] font-medium text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500">
              <Lock size={10} /> Aqred
            </div>
          </div>

          {/* cross-fading screenshots */}
          <div className="relative" style={{ aspectRatio: "1800 / 1108" }}>
            {SHOWCASE.map((s, idx) => (
              <img
                key={s.src}
                src={s.src}
                alt={s.alt}
                loading={idx === 0 ? "eager" : "lazy"}
                className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-[900ms] ease-out ${
                  idx === i ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
          </div>
        </figure>
      </div>

      {/* tabs */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {SHOWCASE.map((s, idx) => (
          <button
            key={s.tab}
            type="button"
            onClick={() => setI(idx)}
            aria-label={`Show ${s.tab}`}
            className={`group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              idx === i
                ? "bg-violet-600 text-white shadow-sm shadow-violet-500/30"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${
              idx === i ? "bg-white" : "bg-slate-300 group-hover:bg-violet-400 dark:bg-slate-600"
            }`} />
            {s.tab}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Hero ──────────────────────────────────────────────────────────────────────
const HERO_CAPABILITIES = [
  { icon: Shield,   label: "Role-based access" },
  { icon: Lock,     label: "Two-factor auth" },
  { icon: Activity, label: "Full audit trail" },
  { icon: FileText, label: "CSV export" },
];

const Hero = () => (
  <section className="relative flex flex-col items-center overflow-hidden bg-white pt-16 dark:bg-gray-900">
    {/* dot grid */}
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: "radial-gradient(circle, rgba(139,92,246,0.09) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, #000 0%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, #000 0%, transparent 75%)",
      }}
    />
    {/* drifting gradient blobs */}
    <div className="pointer-events-none absolute -left-40 top-4 h-[420px] w-[420px] rounded-full bg-violet-300/25 blur-3xl animate-drift-slow dark:bg-violet-600/15" />
    <div className="pointer-events-none absolute -right-40 top-24 h-[380px] w-[380px] rounded-full bg-indigo-300/25 blur-3xl animate-drift-slower dark:bg-indigo-600/15" />
    <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[560px] -translate-x-1/2 rounded-full bg-fuchsia-200/20 blur-3xl dark:bg-fuchsia-700/10" />

    <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-20 pt-10 text-center">
      {/* badge */}
      <div className="mb-6 inline-flex animate-fade-up items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-1.5 text-xs font-semibold text-violet-600 shadow-sm shadow-violet-100/60 dark:border-violet-700/60 dark:bg-gray-800 dark:text-violet-400 dark:shadow-none">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
        Web-Based Management Information System
      </div>

      {/* headline */}
      <h1 className="mb-6 animate-fade-up text-[42px] font-extrabold leading-[1.05] tracking-tight [animation-delay:80ms] sm:text-6xl md:text-[64px]">
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

      {/* subtext */}
      <p className="mx-auto mb-8 max-w-2xl animate-fade-up text-lg font-normal leading-relaxed text-slate-500 [animation-delay:160ms] dark:text-slate-400 sm:text-xl">
        Aqred gives teams a unified platform to manage employees, customers,
        inventory, orders, and analytics - with role-based access built in.
      </p>

      {/* CTAs */}
      <div className="mb-6 flex animate-fade-up flex-wrap items-center justify-center gap-4 [animation-delay:240ms]">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-500/40 active:bg-violet-800"
        >
          Get Started <ArrowRight size={16} />
        </Link>
        <Link
          to="/features"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-7 py-3.5 font-semibold text-slate-700 transition-all hover:border-violet-300 hover:bg-violet-50/50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-violet-700 dark:hover:bg-gray-700"
        >
          Explore features <ChevronRight size={16} />
        </Link>
      </div>

      {/* capabilities */}
      <div className="mb-10 flex animate-fade-up flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs font-medium text-slate-500 [animation-delay:320ms] dark:text-slate-400">
        {HERO_CAPABILITIES.map(({ icon: Icon, label }) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <Icon size={13} className="text-violet-500 dark:text-violet-400" />
            {label}
          </span>
        ))}
      </div>

      {/* product showcase */}
      <div className="animate-scale-in [animation-delay:360ms]">
        <HeroShowcase />
      </div>
    </div>
  </section>
);

// ── Spec strip ────────────────────────────────────────────────────────────────
const SPECS = [
  { k: "Modules",  v: "9 connected" },
  { k: "Roles",    v: "3 built-in, plus custom" },
  { k: "Security", v: "JWT · bcrypt · 2FA · audit log" },
  { k: "Delivery", v: "Web-based, no install" },
];

const Stats = () => (
  <section className="border-y border-gray-100 bg-slate-50 dark:border-gray-800 dark:bg-gray-800/30">
    <div className="mx-auto grid max-w-5xl grid-cols-2 gap-x-4 gap-y-8 px-6 py-10 lg:grid-cols-4">
      {SPECS.map(({ k, v }, i) => (
        <Reveal
          key={k}
          delay={i * 70}
          y={14}
          className={i !== 0 ? "lg:border-l lg:border-gray-200 lg:pl-6 dark:lg:border-gray-700" : ""}
        >
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">{k}</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{v}</p>
        </Reveal>
      ))}
    </div>
  </section>
);

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES_SMALL = [
  { icon: Users,        title: "Employee Management", desc: "Departments, positions, salaries, and employment status.", gradient: "from-violet-500 to-purple-600" },
  { icon: UserCheck,    title: "Customer Management", desc: "Contact records, company details, and full order history.", gradient: "from-blue-500 to-indigo-600" },
  { icon: Package,      title: "Product & Inventory", desc: "Live stock levels, SKUs, categories, and low-stock alerts.", gradient: "from-emerald-500 to-teal-600" },
  { icon: ShoppingCart, title: "Order Management",    desc: "Orders linked end to end to customers and employees.", gradient: "from-amber-500 to-orange-500" },
  { icon: FileText,     title: "Invoices & Payments", desc: "Payment status tracking and a clear financial picture.", gradient: "from-rose-500 to-pink-600" },
  { icon: Activity,     title: "Activity Feed",       desc: "A running log of who changed what, when, and from where.", gradient: "from-cyan-500 to-blue-600" },
];

const ROLE_COVERAGE = [
  { role: "Admin",    count: "7 / 7", pct: 100, cls: "bg-violet-500" },
  { role: "Manager",  count: "6 / 7", pct: 84,  cls: "bg-blue-500" },
  { role: "Employee", count: "1 / 7", pct: 16,  cls: "bg-emerald-500" },
];

const Features = () => (
  <section className="bg-white py-24 dark:bg-gray-900">
    <div className="mx-auto max-w-6xl px-6">
      <Reveal className="mb-14 max-w-xl">
        <SectionLabel>Features</SectionLabel>
        <SectionHeading>
          Built for real{" "}
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            business operations
          </span>
        </SectionHeading>
        <SectionBody>
          Every module shares the same data, so you get one operational picture
          instead of a dozen disconnected tools.
        </SectionBody>
      </Reveal>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* featured tile: Reports & Analytics, with a real screenshot */}
        <Reveal className="sm:col-span-2">
          <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-violet-700 dark:hover:shadow-violet-900/20">
            <div className="p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md transition-transform duration-300 group-hover:scale-110">
                <BarChart2 size={18} className="text-white" />
              </div>
              <h3 className="mb-1.5 text-base font-bold tracking-tight text-slate-900 dark:text-white">Reports &amp; Analytics</h3>
              <p className="max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Interactive dashboards for revenue, orders, and customer trends -
                with one-click CSV export on every view.
              </p>
            </div>
            <div className="relative mt-auto border-t border-gray-100 dark:border-gray-700">
              <img
                src="/shot-analytics.png"
                alt="Aqred revenue analytics with KPI cards and a multi-month trend chart"
                loading="lazy"
                className="block h-36 w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white dark:from-gray-800" />
            </div>
          </article>
        </Reveal>

        {/* role coverage tile */}
        <Reveal delay={80}>
          <article className="group flex h-full flex-col justify-center rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-violet-700 dark:hover:shadow-violet-900/20">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 shadow-md transition-transform duration-300 group-hover:scale-110">
              <Shield size={18} className="text-white" />
            </div>
            <h3 className="mb-1.5 text-base font-bold tracking-tight text-slate-900 dark:text-white">Role-Based Access</h3>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Each role sees only the modules it needs, and admins can fine-tune every permission.
            </p>
            <div className="mt-6 space-y-3">
              {ROLE_COVERAGE.map(({ role, count, pct, cls }) => (
                <div key={role} className="flex items-center gap-3">
                  <span className="w-16 flex-shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400">{role}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div className={`h-full rounded-full ${cls}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 flex-shrink-0 text-right text-[11px] font-medium tabular-nums text-slate-400 dark:text-slate-500">{count}</span>
                </div>
              ))}
            </div>
          </article>
        </Reveal>

        {FEATURES_SMALL.map(({ icon: Icon, title, desc, gradient }, idx) => (
          <Reveal key={title} delay={120 + idx * 60}>
            <article className="group h-full rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-violet-700 dark:hover:shadow-violet-900/20">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-md transition-transform duration-300 group-hover:scale-110`}>
                <Icon size={17} className="text-white" />
              </div>
              <h3 className="mb-1 text-sm font-bold tracking-tight text-slate-900 dark:text-white">{title}</h3>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          to="/features"
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
        >
          See the full feature breakdown
          <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  </section>
);

// ── How it works ──────────────────────────────────────────────────────────────
const STORY_STEPS = [
  {
    step: "01",
    title: "Create your workspace",
    desc: "Register with your name, email, and company name. Your isolated workspace is ready in seconds.",
    img: "/story-register.png",
    alt: "Aqred sign-up form for creating a new company workspace",
  },
  {
    step: "02",
    title: "Set up your roles",
    desc: "Decide what Admins, Managers, and Employees can see and do - module by module.",
    img: "/story-roles.png",
    alt: "Aqred roles and permissions screen showing module access per role",
  },
  {
    step: "03",
    title: "Run your operations",
    desc: "Add customers, products, and orders, then track performance and export reports from one dashboard.",
    img: "/story-dashboard.png",
    alt: "Aqred dashboard showing revenue, orders, and inventory alerts",
  },
];

const StoryFrame = ({ img, alt }) => (
  <figure className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xl shadow-gray-200/60 dark:border-gray-700 dark:bg-gray-800 dark:shadow-black/40">
    <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-3.5 py-2.5 dark:border-gray-700/80 dark:bg-gray-900">
      <span className="h-2 w-2 rounded-full bg-red-400/90" />
      <span className="h-2 w-2 rounded-full bg-amber-400/90" />
      <span className="h-2 w-2 rounded-full bg-emerald-400/90" />
    </div>
    <img src={img} alt={alt} loading="lazy" className="block w-full" style={{ aspectRatio: "1800 / 1108", objectFit: "cover", objectPosition: "top" }} />
  </figure>
);

const HowItWorks = () => {
  const [active, setActive] = useState(0);
  const stepRefs = useRef([]);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (reduced || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(Number(entry.target.dataset.idx));
        });
      },
      { threshold: 0.6, rootMargin: "-25% 0px -25% 0px" }
    );
    stepRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [reduced]);

  return (
    <section className="bg-slate-50 py-24 dark:bg-gray-800/20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-14 text-center">
          <SectionLabel>How it works</SectionLabel>
          <SectionHeading center>
            Up and running{" "}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              in minutes
            </span>
          </SectionHeading>
          <SectionBody center className="max-w-md">
            No rollout project, no training week. Three steps and your whole team is in.
          </SectionBody>
        </Reveal>

        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-16">
          {/* steps */}
          <div className="space-y-3">
            {STORY_STEPS.map(({ step, title, desc, img, alt }, idx) => (
              <Reveal key={step} delay={idx * 90}>
                <div
                  ref={(el) => { stepRefs.current[idx] = el; }}
                  data-idx={idx}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActive(idx)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActive(idx); } }}
                  className={`cursor-pointer rounded-2xl border p-5 transition-all duration-300 ${
                    active === idx
                      ? "border-violet-200 bg-white shadow-lg shadow-violet-100/60 dark:border-violet-700/70 dark:bg-gray-800"
                      : "border-transparent hover:bg-white/70 dark:hover:bg-gray-800/40"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-3">
                    <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-black transition-colors ${
                      active === idx
                        ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white"
                        : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                    }`}>
                      {step}
                    </span>
                    <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">{title}</h3>
                  </div>
                  <p className="pl-11 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>

                  {/* inline visual on mobile / tablet */}
                  <div className="mt-4 pl-11 lg:hidden">
                    <StoryFrame img={img} alt={alt} />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* crossfading visual (desktop) */}
          <Reveal delay={120} className="hidden lg:block">
            <div className="relative">
              {STORY_STEPS.map(({ img, alt }, idx) => (
                <div
                  key={img}
                  aria-hidden={idx !== active}
                  className={`transition-opacity duration-500 ${idx === active ? "relative opacity-100" : "absolute inset-0 opacity-0"}`}
                >
                  <StoryFrame img={img} alt={alt} />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

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
  <section className="bg-white py-24 dark:bg-gray-900">
    <div className="mx-auto max-w-5xl px-6">
      <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-2">
        <Reveal>
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
            {BENEFITS.map(({ icon: Icon, title, desc }, idx) => (
              <Reveal key={title} delay={idx * 80} y={14}>
                <div className="group flex items-start gap-4 rounded-xl p-4 transition-colors hover:bg-slate-50 dark:hover:bg-gray-800/50">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-200 transition-transform duration-200 group-hover:scale-105 dark:shadow-violet-900/30">
                    <Icon size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-bold tracking-tight text-slate-900 dark:text-white">{title}</p>
                    <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* roles card */}
        <Reveal delay={120}>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg shadow-gray-100/80 dark:border-gray-700 dark:bg-gray-800 dark:shadow-black/30">
            <div className="border-b border-gray-100 bg-slate-50/80 px-6 py-4 dark:border-gray-700 dark:bg-gray-900/40">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                Access roles - who sees what
              </p>
            </div>

            <div className="space-y-3 p-5">
              {ROLES.map(({ role, colorClass, barClass, modules }) => (
                <div
                  key={role}
                  className="rounded-xl border border-gray-100 p-4 transition-all hover:border-gray-200 hover:shadow-sm dark:border-gray-700/80 dark:hover:border-gray-600"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${colorClass}`}>{role}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 7 }).map((_, idx) => (
                          <div key={idx} className={`h-1.5 w-3 rounded-full ${idx < modules.length ? barClass : "bg-gray-100 dark:bg-gray-700"}`} />
                        ))}
                      </div>
                      <span className="text-[10px] font-medium tabular-nums text-gray-400">{modules.length}/7</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {modules.map((m) => (
                      <span key={m} className="rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-xs font-medium text-slate-600 dark:border-gray-600 dark:bg-gray-700 dark:text-slate-300">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 pb-5">
              <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                Admins can also create custom roles with any combination of module access.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);

// ── CTA ───────────────────────────────────────────────────────────────────────
const CTA = () => (
  <section className="bg-slate-50 py-24 dark:bg-gray-800/20">
    <div className="mx-auto max-w-4xl px-6">
      <Reveal>
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-20 text-center sm:px-16"
          style={{ background: "linear-gradient(135deg,#7c3aed 0%,#6d28d9 45%,#4338ca 100%)" }}
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/5 animate-drift-slower" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/5 animate-drift-slow" />
          <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative">
            <SectionLabel inverted>Get started today</SectionLabel>
            <h2 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              Ready to streamline<br className="hidden sm:block" /> your operations?
            </h2>
            <SectionBody inverted className="mx-auto mb-10 max-w-lg">
              Register with your company name and your workspace is ready. No installation,
              no configuration - just a clean system to run your operations from.
            </SectionBody>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-bold text-violet-700 shadow-xl shadow-violet-900/25 transition-colors hover:bg-violet-50 active:bg-violet-100"
              >
                Create your account <ArrowRight size={16} />
              </Link>
              <Link
                to="/documentation"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/25 px-8 py-3.5 font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/10"
              >
                Read the docs
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

// ── Page ──────────────────────────────────────────────────────────────────────
const LandingPage = () => (
  <div className="bg-white font-sans antialiased dark:bg-gray-900">
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
