const EmptyState = ({ icon: Icon, title, description, action, actionLabel, onAction }) => (
  <div className="py-16 text-center">
    {Icon && <Icon size={36} className="mx-auto mb-4 text-gray-200 dark:text-gray-700" />}
    <p className="text-gray-500 dark:text-gray-400 font-semibold text-sm">{title}</p>
    {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 max-w-xs mx-auto">{description}</p>}
    {onAction && actionLabel && (
      <button
        onClick={onAction}
        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 active:scale-95 transition-all"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
