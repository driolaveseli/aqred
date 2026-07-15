import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, ArrowUpRight, Download } from "lucide-react";

const data = [
  { name: "Jan", revenue: 4000, orders: 240 },
  { name: "Feb", revenue: 3000, orders: 198 },
  { name: "Mar", revenue: 5000, orders: 310 },
  { name: "Apr", revenue: 4780, orders: 280 },
  { name: "May", revenue: 5890, orders: 390 },
  { name: "Jun", revenue: 6390, orders: 420 },
];

const Reports = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">
            Business Analytics
          </h2>
          <p className="text-sm text-slate-500">
            Deep dive into your sales and performance metrics.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-700 transition-all self-start sm:self-auto">
          <Download size={18} /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-4 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="text-blue-600" /> Revenue Growth
            </h3>
            <span className="text-emerald-500 font-bold bg-emerald-50 px-3 py-1 rounded-full text-sm">
              +24% vs last month
            </span>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between">
          <div>
            <p className="text-slate-400 font-medium">Annual Projection</p>
            <h4 className="text-4xl font-bold mt-2">$142,500.00</h4>
            <div className="flex items-center gap-2 text-emerald-400 mt-4">
              <ArrowUpRight size={20} />
              <span className="font-bold">On track for Q4 target</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                Top Product
              </p>
              <p className="text-lg font-semibold mt-1">
                Enterprise Subscription
              </p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                Avg Order Value
              </p>
              <p className="text-lg font-semibold mt-1">$452.10</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
