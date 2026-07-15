/** Custom Recharts tooltip that matches the app's design language */
const ChartTooltip = ({ active, payload, label, formatter, labelFormatter }) => {
  if (!active || !payload?.length) return null;

  const displayLabel = labelFormatter ? labelFormatter(label) : label;

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3.5 py-2.5 text-xs min-w-[120px]">
      {displayLabel && (
        <p className="text-gray-500 font-medium mb-1.5 pb-1.5 border-b border-gray-50">{displayLabel}</p>
      )}
      {payload.map((entry, i) => {
        const [value, name] = formatter ? formatter(entry.value, entry.name) : [entry.value, entry.name];
        return (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-gray-500">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
              {name}
            </span>
            <span className="font-semibold text-gray-900">{value}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ChartTooltip;
