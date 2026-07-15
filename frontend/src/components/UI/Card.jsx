const Card = ({ title, value, trend, trendUp }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
    <p className="text-sm text-gray-500 font-medium">{title}</p>
    <div className="flex items-center justify-between mt-2">
      <h2 className="text-2xl font-bold">{value}</h2>
      <span
        className={`text-xs px-2 py-1 rounded-full font-bold ${
          trendUp ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
        }`}
      >
        {trend}
      </span>
    </div>
  </div>
);

export default Card;
