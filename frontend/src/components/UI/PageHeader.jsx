const TONE = {
  violet:  "bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700/50 text-violet-700 dark:text-violet-300",
  amber:   "bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/40 text-amber-700 dark:text-amber-400",
  red:     "bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-700/40 text-red-700 dark:text-red-400",
  emerald: "bg-emerald-100 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-400",
  blue:    "bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/40 text-blue-700 dark:text-blue-400",
  gray:    "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400",
};

// Shared "hero" header shell used at the top of every page — gradient wash,
// top accent bar, optional contextual badges, title/subtitle, right-aligned
// actions. Mirrors the treatment Dashboard.jsx originated.
const PageHeader = ({ title, subtitle, badges = [], actions }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
    <div className="absolute inset-0 bg-gradient-to-br from-violet-50/60 via-white to-indigo-50/50 dark:from-violet-900/10 dark:via-transparent dark:to-indigo-900/10 pointer-events-none" />
    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 via-purple-400 to-indigo-500" />
    <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-violet-100/40 dark:bg-violet-800/10 pointer-events-none" />
    <div className="absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-indigo-100/30 dark:bg-indigo-800/10 pointer-events-none" />
    <div className="relative px-6 py-5 flex flex-wrap items-center justify-between gap-y-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h1>
          {badges.map(({ icon: Icon, label, tone = "gray" }, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border flex-shrink-0 ${TONE[tone]}`}
            >
              {Icon && <Icon size={9} />}
              {label}
            </span>
          ))}
        </div>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  </div>
);

export default PageHeader;
