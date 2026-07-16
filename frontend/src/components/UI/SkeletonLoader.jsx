/** Animated pulse skeleton shapes */

export const SkeletonLine = ({ width = "w-full", height = "h-4" }) => (
  <div className={`${width} ${height} bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse`} />
);

export const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
      <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl" />
    </div>
    <div className="h-7 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
  </div>
);

export const SkeletonRow = ({ cols = 5 }) => (
  <tr className="border-b border-gray-50 dark:border-gray-800/60">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-5 py-4">
        <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" style={{ width: `${60 + (i % 3) * 15}%` }} />
      </td>
    ))}
  </tr>
);

export const SkeletonTable = ({ rows = 5, cols = 5 }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
    <div className="border-b border-gray-100 dark:border-gray-800 px-5 py-3.5 flex gap-6 animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-3 bg-gray-100 dark:bg-gray-800 rounded" style={{ width: `${50 + i * 10}px` }} />
      ))}
    </div>
    <table className="w-full">
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} cols={cols} />
        ))}
      </tbody>
    </table>
  </div>
);

export const SkeletonStats = ({ count = 4 }) => (
  <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(count, 4)} gap-4 mb-6`}>
    {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
  </div>
);

const SkeletonLoader = ({ type = "page", rows = 5, cols = 5, statCount = 4 }) => {
  if (type === "stats") return <SkeletonStats count={statCount} />;
  if (type === "table") return <SkeletonTable rows={rows} cols={cols} />;

  return (
    <div className="space-y-6 animate-pulse">
      <SkeletonStats count={statCount} />
      <SkeletonTable rows={rows} cols={cols} />
    </div>
  );
};

export default SkeletonLoader;
