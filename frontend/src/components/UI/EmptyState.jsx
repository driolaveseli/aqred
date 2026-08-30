import { Inbox } from "lucide-react";

/* Original, on-brand empty-state artwork: a ghosted list panel with the
   section's own icon floating above it in the same gradient badge the 404
   page uses. Monochrome violet and low-contrast on purpose — it signals
   "nothing here yet" without pulling focus from the message. */
const EmptyArt = ({ icon: Icon = Inbox }) => (
  <div className="relative mx-auto mb-5 h-[104px] w-[150px] select-none" aria-hidden="true">
    {/* soft floating accents */}
    <span className="absolute left-1 top-4 h-1.5 w-1.5 rounded-full bg-violet-300/70 dark:bg-violet-700/60" />
    <span className="absolute right-2 top-9 h-1 w-1 rounded-full bg-indigo-300/70 dark:bg-indigo-700/50" />
    <span className="absolute bottom-1.5 left-9 h-1 w-1 rounded-full bg-violet-300/60 dark:bg-violet-700/50" />

    {/* ghosted list panel */}
    <svg
      viewBox="0 0 150 104"
      className="absolute inset-0 h-full w-full text-violet-500 dark:text-violet-400 dark:opacity-[0.7]"
      fill="none"
    >
      <rect x="24" y="30" width="102" height="66" rx="10" fill="currentColor" fillOpacity="0.06" />
      <rect
        x="15" y="38" width="120" height="58" rx="10"
        fill="currentColor" fillOpacity="0.07"
        stroke="currentColor" strokeOpacity="0.14" strokeWidth="1.5"
      />
      <circle cx="31" cy="56" r="4.5" fill="currentColor" fillOpacity="0.20" />
      <rect x="42" y="53" width="54" height="6" rx="3" fill="currentColor" fillOpacity="0.17" />
      <circle cx="31" cy="74" r="4.5" fill="currentColor" fillOpacity="0.13" />
      <rect x="42" y="71" width="68" height="6" rx="3" fill="currentColor" fillOpacity="0.12" />
      <circle cx="31" cy="88" r="4.5" fill="currentColor" fillOpacity="0.08" />
      <rect x="42" y="85" width="42" height="6" rx="3" fill="currentColor" fillOpacity="0.07" />
    </svg>

    {/* section icon, floating on top */}
    <div
      className="absolute left-1/2 top-0 flex h-12 w-12 -translate-x-1/2 items-center justify-center
        rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600
        shadow-lg shadow-violet-300/50 ring-4 ring-white dark:shadow-none dark:ring-gray-900"
    >
      <Icon size={20} strokeWidth={2} className="text-white" />
    </div>
  </div>
);

const EmptyState = ({ icon, title, description, actionLabel, onAction }) => (
  <div className="py-14 text-center">
    <EmptyArt icon={icon} />
    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{title}</p>
    {description && (
      <p className="mx-auto mt-1.5 max-w-xs text-xs text-gray-400 dark:text-gray-500">{description}</p>
    )}
    {onAction && actionLabel && (
      <button
        onClick={onAction}
        className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 active:scale-95 transition-all"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
