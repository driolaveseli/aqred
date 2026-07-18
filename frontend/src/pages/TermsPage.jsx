import { FileText, Info } from "lucide-react";
import PublicNavbar from "../components/PublicNavbar";
import PublicFooter from "../components/PublicFooter";

const SECTIONS = [
  {
    title: "1. About this document",
    body: "Aqred is a portfolio project, not a commercial product. This page is a sample Terms of Service included so the registration flow doesn't link to a dead page — it is illustrative only and is not a binding legal agreement.",
  },
  {
    title: "2. Account registration",
    body: "By creating an account you confirm the information you provide is accurate. Accounts are used to demonstrate role-based access (admin, manager, employee) within a single organization's workspace.",
  },
  {
    title: "3. Data",
    body: "Data entered into this system (customers, orders, products, etc.) is intended for demonstration purposes. Do not enter real personal or payment information.",
  },
  {
    title: "4. No warranty",
    body: "This software is provided \"as is\", without warranty of any kind, for demonstration and evaluation purposes.",
  },
];

const TermsPage = () => (
  <div className="min-h-screen bg-white dark:bg-gray-900 font-sans antialiased">
    <PublicNavbar />
    <main className="pt-16">
      <div className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-16 pt-24 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <FileText size={12} className="text-violet-500" />
          Terms & Conditions
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-violet-700 dark:text-violet-300 mb-3 leading-tight tracking-tight">
          Sample Terms of Service
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-14">
        <div className="flex items-start gap-3 p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/40 rounded-xl mb-10">
          <Info size={16} className="text-violet-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-violet-700 dark:text-violet-300">
            This is a sample document for a portfolio project — not a real legal agreement.
          </p>
        </div>
        <div className="space-y-8">
          {SECTIONS.map(({ title, body }) => (
            <div key={title}>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
    <PublicFooter />
  </div>
);

export default TermsPage;
