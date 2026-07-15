import { Target, Users, Lightbulb, Award, Code2, Database, Server, CheckCircle, Info, Layers } from "lucide-react";
import PublicNavbar from "../components/PublicNavbar";
import PublicFooter from "../components/PublicFooter";

const AboutPage = () => (
  <div className="min-h-screen bg-white dark:bg-gray-900 font-sans antialiased">
    <PublicNavbar />
    <main className="pt-16">

      {/* ── Hero ── */}
      <div className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-20 pt-28 text-center">
        {/* pill badge */}
        <div className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Layers size={12} className="text-violet-500" />
          About Aqred
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-violet-700 dark:text-violet-300 mb-4 leading-tight tracking-tight">
          A modern platform<br />built for business
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-base mt-2">
          A modern business management platform built to simplify operations for growing teams
        </p>
      </div>

      {/* ── What is Aqred? ── */}
      <div className="bg-white dark:bg-gray-900 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          {/* small violet info icon above */}
          <div className="flex justify-center mb-5">
            <div className="w-10 h-10 bg-violet-50 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
              <Info size={19} className="text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-6">
            What is Aqred?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-5">
            Aqred is a web-based Management Information System (MIS) that gives businesses a single,
            structured platform to manage their people, customers, products, and finances. Instead of
            scattered spreadsheets and disconnected tools, Aqred brings everything into one organized
            system with clear roles, real-time data, and built-in security.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            From a small team managing daily operations to an admin overseeing multiple departments,
            Aqred adapts to how your business works — giving each person exactly the access and
            information they need.
          </p>
          {/* thin bottom gradient divider */}
          <div className="mt-16 h-px w-full bg-gradient-to-r from-transparent via-violet-300 dark:via-violet-700 to-transparent opacity-60" />
        </div>
      </div>

      {/* ── Core Values ── */}
      <div className="bg-gray-50/60 dark:bg-gray-800/20 py-20">
        <div className="max-w-5xl mx-auto px-6">
          {/* section label pill */}
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800 text-violet-600 dark:text-violet-400 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
              What Drives Us
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-10 tracking-tight">
            Core Values
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: Target,
                title: "Clarity",
                desc: "Every module is designed to present information clearly, so decisions are based on real data — not guesswork.",
              },
              {
                icon: Users,
                title: "Teamwork",
                desc: "Role-based access means each team member has a tailored view — no information overload, no blind spots.",
              },
              {
                icon: Lightbulb,
                title: "Simplicity",
                desc: "Complex operations broken into simple, actionable workflows. No steep learning curves.",
              },
              {
                icon: Award,
                title: "Reliability",
                desc: "Built on proven technologies with security, audit logging, and data integrity at the foundation.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-4 p-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:-translate-y-0.5 transition-all shadow-sm"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
                  <Icon size={19} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-base text-gray-900 dark:text-white mb-1">{title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── What It Covers ── */}
      <div className="bg-white dark:bg-gray-900 py-20">
        <div className="max-w-5xl mx-auto px-6">
          {/* section label pill */}
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800 text-violet-600 dark:text-violet-400 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
              Full Coverage
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-10 tracking-tight">
            What It Covers
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Employee profiles, departments & salaries",
                "Customer directory & order history",
                "Product catalog & inventory tracking",
                "Order creation & status management",
                "Sales, invoices & payment tracking",
                "Reports & revenue analytics",
                "Role-based access & custom permissions",
                "Audit logs & system-wide settings",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-violet-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Built With ── */}
      <div className="bg-gray-50/60 dark:bg-gray-800/20 py-20">
        <div className="max-w-5xl mx-auto px-6">
          {/* section label pill */}
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800 text-violet-600 dark:text-violet-400 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
              Tech Stack
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-10 tracking-tight">
            Built With
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Code2,
                layer: "Frontend",
                items: ["React 19", "React Router v7", "Tailwind CSS v3", "Recharts"],
              },
              {
                icon: Server,
                layer: "Backend",
                items: ["Node.js", "Express v5", "JWT Authentication", "bcrypt"],
              },
              {
                icon: Database,
                layer: "Database",
                items: ["PostgreSQL", "Relational schema", "Audit logging", "Multi-tenant"],
              },
            ].map(({ icon: Icon, layer, items }) => (
              <div key={layer} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                {/* gradient top bar */}
                <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-indigo-600 rounded-t-2xl" />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow">
                      <Icon size={16} className="text-white" />
                    </div>
                    <h3 className="font-bold text-violet-600 dark:text-violet-400 text-sm">{layer}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <span
                        key={item}
                        className="text-xs bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 text-violet-700 dark:text-violet-400 rounded-full px-3 py-1"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </main>
    <PublicFooter />
  </div>
);

export default AboutPage;
