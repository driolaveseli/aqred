import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

// Shared sortable <th> — click toggles sort on `field`, arrow reflects the
// current sortField/sortDir. Previously duplicated verbatim (component +
// sort-icon logic) inside several page components; defining it there meant a
// new identity every render of that page, so React remounted every header
// cell (and anything below them in the tree) on every keystroke/state change.
const SortableTh = ({ field, children, className = "px-5 py-3.5", sortField, sortDir, onSort }) => (
  <th
    onClick={() => onSort(field)}
    className={`text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-600 dark:hover:text-gray-300 transition-colors ${className}`}
  >
    {children}
    {sortField !== field
      ? <ChevronsUpDown size={12} className="text-gray-300 dark:text-gray-600 ml-1 inline-block" />
      : sortDir === "asc"
        ? <ChevronUp size={12} className="text-violet-500 dark:text-violet-400 ml-1 inline-block" />
        : <ChevronDown size={12} className="text-violet-500 dark:text-violet-400 ml-1 inline-block" />}
  </th>
);

export default SortableTh;
