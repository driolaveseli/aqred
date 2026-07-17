const Toggle = ({ checked, onChange, disabled }) => (
  <button
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`relative rounded-full transition-all flex-shrink-0 ${
      checked ? "bg-violet-600 shadow-lg shadow-violet-500/30" : "bg-gray-200 dark:bg-gray-700"
    } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:scale-105"}`}
    style={{ width: "2.5rem", height: "1.375rem" }}
  >
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
  </button>
);

export default Toggle;
