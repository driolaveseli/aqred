import { useState, useEffect } from "react";
import { Download, Users, TrendingUp, Award, Clock, AlertCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie,
} from "recharts";
import { getEmployees } from "../services/employeesService";
import { exportToCSV } from "../utils/exportCSV";
import { useSystem } from "../context/SystemContext";
import PageHeader from "../components/UI/PageHeader";

const DEPT_COLORS = {
  Engineering: "#7c3aed",
  Sales: "#6366f1",
  Support: "#a78bfa",
  Marketing: "#c4b5fd",
  HR: "#ddd6fe",
  Finance: "#818cf8",
  Operations: "#4f46e5",
};
const DEFAULT_COLOR = "#94a3b8";

const EmployeeReports = () => {
  const { t } = useSystem();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEmployees()
      .then(({ data }) => setEmployees(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = employees.length;
  const active = employees.filter((e) => (e.status || "Active") === "Active").length;
  const avgSalary = total
    ? Math.round(employees.reduce((s, e) => s + (Number(e.salary) || 0), 0) / total)
    : 0;

  // Department breakdown from real data
  const deptMap = {};
  employees.forEach((e) => {
    const d = e.department || "Engineering";
    deptMap[d] = (deptMap[d] || 0) + 1;
  });
  const deptData = Object.entries(deptMap).map(([name, value]) => ({
    name, value, color: DEPT_COLORS[name] || DEFAULT_COLOR,
  }));

  const handleExport = () =>
    exportToCSV(
      employees.map((e) => ({
        Name: e.name,
        Email: e.email,
        Position: e.position || "",
        Department: e.department || "",
        Salary: e.salary ?? "",
        Status: e.status || "Active",
      })),
      "employee-report"
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-200 dark:border-violet-800 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t("Employee Reports")}
        subtitle={t("Workforce analytics based on current employee records")}
        badges={[]}
        actions={
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 self-start sm:self-auto"
          >
            <Download size={15} /> Export CSV
          </button>
        }
      />

      {total === 0 && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-xl text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle size={16} className="flex-shrink-0" />
          No employee records found. Add employees in the Employees module to see real analytics here.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {[
          { label: "Total Employees", value: total, icon: Users, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20" },
          { label: "Active", value: active, icon: TrendingUp, color: "text-green-600 dark:text-emerald-400", bg: "bg-green-50 dark:bg-emerald-900/20" },
          { label: "Departments", value: deptData.length, icon: Award, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
          {
            label: "Avg. Salary",
            value: avgSalary > 0
              ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(avgSalary)
              : "—",
            icon: Clock,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-900/20",
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.label}</p>
                <div className={`w-9 h-9 ${kpi.bg} rounded-xl flex items-center justify-center`}>
                  <Icon size={17} className={kpi.color} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Department bar chart */}
        <div className="md:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Employees by Department</h3>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip />
                <Bar dataKey="value" name="Employees" radius={[0, 4, 4, 0]} data={deptData.map((e) => ({ ...e, fill: e.color }))} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">No data yet</div>
          )}
        </div>

        {/* Dept pie */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Department Split</h3>
          {deptData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={deptData.map((e) => ({ ...e, fill: e.color }))} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value" />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {deptData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{d.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[160px] flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Employee list */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">All Employees</h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">{total} records</span>
        </div>
        {total > 0 ? (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b border-gray-50 dark:border-gray-800/60">
                {["Employee", "Position", "Department", "Salary", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((e, i) => (
                <tr key={e.id} className={i !== employees.length - 1 ? "border-b border-gray-50 dark:border-gray-800/60" : ""}>
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-800 dark:text-gray-100">{e.name}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400">{e.position || "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 text-xs font-medium bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-full">{e.department || "—"}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                    {e.salary ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(e.salary) : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${(e.status || "Active") === "Active" ? "bg-green-50 dark:bg-emerald-900/20 text-green-600 dark:text-emerald-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
                      {e.status || "Active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : (
          <div className="py-14 text-center">
            <Users size={30} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No employees yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add employees in the Employees module</p>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
        Note: Employee records (HR data) are separate from User accounts (system access). User Management controls who can log in.
      </p>
    </div>
  );
};

export default EmployeeReports;
