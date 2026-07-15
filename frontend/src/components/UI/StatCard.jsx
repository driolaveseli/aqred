/** Canonical stat card used across all pages */
const StatCard = ({ label, value, color = "text-gray-900", bg = "bg-gray-50", icon: Icon, trend, trendLabel }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      {Icon && (
        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon size={15} className={color} />
        </div>
      )}
    </div>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    {trend !== undefined && (
      <p className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
        {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
        {trendLabel && <span className="text-gray-400 font-normal">{trendLabel}</span>}
      </p>
    )}
  </div>
);

export default StatCard;
