import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Revenue Overview - Area chart with blue fill
export const RevenueChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={220}>
    <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis
        dataKey="name"
        tick={{ fontSize: 11, fill: "#9ca3af" }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        tick={{ fontSize: 11, fill: "#9ca3af" }}
        axisLine={false}
        tickLine={false}
        tickFormatter={(v) => v.toLocaleString()}
      />
      <Tooltip
        contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
        formatter={(val) => [`$${val.toLocaleString()}`, "Revenue"]}
      />
      <Area
        type="monotone"
        dataKey="revenue"
        stroke="#3b82f6"
        strokeWidth={2}
        fill="url(#revenueGradient)"
        dot={false}
        activeDot={{ r: 4, fill: "#3b82f6" }}
      />
    </AreaChart>
  </ResponsiveContainer>
);

// Sales vs Orders - Dual line chart with green
export const SalesOrdersChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={220}>
    <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis
        dataKey="name"
        tick={{ fontSize: 11, fill: "#9ca3af" }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        tick={{ fontSize: 11, fill: "#9ca3af" }}
        axisLine={false}
        tickLine={false}
      />
      <Tooltip
        contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
      />
      <Legend
        wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        iconType="circle"
        iconSize={8}
      />
      <Line
        type="monotone"
        dataKey="sales"
        stroke="#10b981"
        strokeWidth={2}
        dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
        activeDot={{ r: 5 }}
      />
      <Line
        type="monotone"
        dataKey="orders"
        stroke="#10b981"
        strokeWidth={2}
        strokeDasharray="4 2"
        dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
        activeDot={{ r: 5 }}
      />
    </LineChart>
  </ResponsiveContainer>
);

// Products Distribution - Pie chart
const PIE_COLORS = ["#3b82f6", "#10b981", "#ef4444", "#f59e0b"];

const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, name, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 30;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#6b7280"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={11}
    >
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const ProductsDistributionChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={220}>
    <PieChart>
      <Pie
        data={data.map((entry, index) => ({ ...entry, fill: PIE_COLORS[index % PIE_COLORS.length] }))}
        cx="50%"
        cy="50%"
        outerRadius={75}
        dataKey="value"
        labelLine={true}
        label={renderCustomLabel}
      />
      <Tooltip
        contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
        formatter={(val, name) => [`${val}%`, name]}
      />
    </PieChart>
  </ResponsiveContainer>
);

// Monthly Comparison - Bar chart with two bars (sales blue, revenue green)
export const MonthlyComparisonChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={220}>
    <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barGap={2}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
      <XAxis
        dataKey="name"
        tick={{ fontSize: 11, fill: "#9ca3af" }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        tick={{ fontSize: 11, fill: "#9ca3af" }}
        axisLine={false}
        tickLine={false}
        tickFormatter={(v) => v.toLocaleString()}
      />
      <Tooltip
        contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
      />
      <Legend
        wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        iconType="square"
        iconSize={10}
      />
      <Bar dataKey="sales" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={12} />
      <Bar dataKey="revenue" fill="#10b981" radius={[3, 3, 0, 0]} barSize={12} />
    </BarChart>
  </ResponsiveContainer>
);

// Legacy export kept for compatibility
export const SalesChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} />
    </LineChart>
  </ResponsiveContainer>
);
