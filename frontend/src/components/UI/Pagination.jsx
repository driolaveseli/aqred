import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * Shared pagination control for server-paginated tables.
 * page/totalPages/total/pageSize describe the current server response;
 * onPageChange/onPageSizeChange trigger a re-fetch from the parent page.
 */
const Pagination = ({ page, totalPages, total, pageSize, onPageChange, onPageSizeChange, itemLabel = "items" }) => {
  if (total === 0) return null;

  const safePage = Math.min(Math.max(1, page), totalPages);
  const rangeStart = Math.min((safePage - 1) * pageSize + 1, total);
  const rangeEnd   = Math.min(safePage * pageSize, total);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-400">
          Showing{" "}
          <span className="font-semibold text-gray-600">{rangeStart}</span>
          {" – "}
          <span className="font-semibold text-gray-600">{rangeEnd}</span>
          {" "}of{" "}
          <span className="font-semibold text-gray-600">{total}</span>
          {" "}{itemLabel}
        </p>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            disabled={safePage === 1}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-violet-600 hover:bg-violet-50 hover:border-violet-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={14} />
          </button>
          {pageNumbers.map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-gray-400">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] h-[32px] text-xs font-bold rounded-xl border transition-all
                  ${safePage === p
                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-violet-600 shadow-lg shadow-violet-300/40"
                    : "border-gray-200 text-gray-600 hover:text-violet-600 hover:bg-violet-50 hover:border-violet-200"}`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
            disabled={safePage === totalPages}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-violet-600 hover:bg-violet-50 hover:border-violet-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
