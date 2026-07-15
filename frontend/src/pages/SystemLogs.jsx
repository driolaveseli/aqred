import { useState, useEffect, useCallback } from "react";
import { Shield, RefreshCw, Trash2, Search, Filter, Download, AlertTriangle, Info, Lock, XCircle, ScrollText } from "lucide-react";
import { getLogs, getModules, clearOldLogs } from "../services/logsService";
import { getCompanies } from "../services/superAdminService";
import { useSystem } from "../context/SystemContext";
import { useAuth } from "../context/AuthContext";

const LEVEL_STYLES = {
  INFO:     "bg-blue-50 text-blue-600",
  WARNING:  "bg-amber-50 text-amber-600",
  ERROR:    "bg-red-50 text-red-600",
  SECURITY: "bg-purple-50 text-purple-600",
};

const LEVEL_ROW = {
  WARNING:  "bg-amber-50/30",
  ERROR:    "bg-red-50/30",
  SECURITY: "bg-purple-50/20",
};

const LEVEL_ICON = {
  INFO:     <Info size={11} />,
  WARNING:  <AlertTriangle size={11} />,
  ERROR:    <XCircle size={11} />,
  SECURITY: <Lock size={11} />,
};

const LIMITS = [50, 100, 250, 500];

export default function SystemLogs() {
  const { t } = useSystem();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [logs, setLogs]           = useState([]);
  const [modules, setModules]     = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);

  const [filters, setFilters] = useState({
    level: "", module: "", search: "", limit: 100, company_id: "",
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: filters.limit };
      if (filters.level)      params.level      = filters.level;
      if (filters.module)     params.module     = filters.module;
      if (filters.search)     params.search     = filters.search;
      if (filters.company_id) params.company_id = filters.company_id;
      const res = await getLogs(params);
      setLogs(res.data);
    } catch {
      showToast("Failed to load logs", "error");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    getModules().then(r => setModules(r.data)).catch(() => {});
    if (isSuperAdmin) {
      getCompanies().then(r => setCompanies(r.data)).catch(() => {});
    }
  }, [isSuperAdmin]);

  const handleClearOld = async () => {
    if (!window.confirm("Delete all logs older than 30 days?")) return;
    try {
      const res = await clearOldLogs();
      showToast(res.data.message || "Old logs cleared");
      fetchLogs();
    } catch {
      showToast("Failed to clear logs", "error");
    }
  };

  const exportCSV = () => {
    if (!logs.length) return;
    const headers = ["Timestamp", "Level", "Module", "Action", "User", "Role", "Description", "IP"];
    const rows = logs.map(l => [
      new Date(l.timestamp).toLocaleString(),
      l.level, l.module || "-", l.action || "-",
      l.user_name || "-", l.user_role || "-",
      `"${(l.description || "").replace(/"/g, '""')}"`,
      l.ip_address ? l.ip_address.replace(/^::ffff:/, "").replace(/^::1$/, "127.0.0.1") : "-",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `system_logs_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  const counts = {
    total:    logs.length,
    INFO:     logs.filter(l => l.level === "INFO").length,
    WARNING:  logs.filter(l => l.level === "WARNING").length,
    ERROR:    logs.filter(l => l.level === "ERROR").length,
    SECURITY: logs.filter(l => l.level === "SECURITY").length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            <Shield size={20} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t("System Logs")}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isSuperAdmin ? "Audit trail across all companies" : "Audit trail for your company"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={fetchLogs}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 bg-white rounded-lg hover:bg-gray-50">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 bg-white rounded-lg hover:bg-gray-50">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={handleClearOld}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100">
            <Trash2 size={14} /> Clear &gt;30 days
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 md:gap-4 mb-6">
        {[
          { label: "Total",    value: counts.total,    cls: "text-gray-900" },
          { label: "Info",     value: counts.INFO,     cls: "text-blue-600" },
          { label: "Warning",  value: counts.WARNING,  cls: "text-amber-600" },
          { label: "Error",    value: counts.ERROR,    cls: "text-red-600" },
          { label: "Security", value: counts.SECURITY, cls: "text-purple-600" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 mb-4">
        <div className="relative w-full sm:w-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search description..."
            value={filters.search}
            onChange={e => setFilter("search", e.target.value)}
            className="w-full sm:w-64 pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-white border border-gray-100 rounded-xl p-1">
          <Filter size={13} className="text-gray-400 ml-1" />
          {["", "INFO", "WARNING", "ERROR", "SECURITY"].map(lvl => (
            <button key={lvl} onClick={() => setFilter("level", lvl)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filters.level === lvl ? "bg-violet-600 text-white" : "text-gray-500 hover:text-gray-700"}`}>
              {lvl || "All"}
            </button>
          ))}
        </div>

        <select value={filters.module} onChange={e => setFilter("module", e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20">
          <option value="">All Modules</option>
          {modules.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <select value={filters.limit} onChange={e => setFilter("limit", Number(e.target.value))}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20">
          {LIMITS.map(l => <option key={l} value={l}>Last {l}</option>)}
        </select>

        {isSuperAdmin && (
          <select value={filters.company_id} onChange={e => setFilter("company_id", e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20">
            <option value="">All Companies</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {["Level", "Module", "Action", "User", ...(isSuperAdmin ? ["Company"] : []), "Description", "IP", "Timestamp"].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono">
            {!loading && logs.map((log, idx) => (
              <tr key={log.id}
                className={`${LEVEL_ROW[log.level] || ""} ${idx !== logs.length - 1 ? "border-b border-gray-50" : ""}`}>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-md ${LEVEL_STYLES[log.level] || "bg-gray-100 text-gray-600"}`}>
                    {LEVEL_ICON[log.level]} {log.level}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs font-medium text-gray-600 capitalize">{log.module || "-"}</td>
                <td className="px-5 py-3.5 text-xs text-gray-500">{log.action || "-"}</td>
                <td className="px-5 py-3.5 text-xs text-gray-600">
                  {log.user_name ? (
                    <div>
                      <div className="font-medium">{log.user_name}</div>
                      <div className="text-gray-400">{log.user_role}</div>
                    </div>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                {isSuperAdmin && (
                  <td className="px-5 py-3.5 text-xs text-gray-500">
                    {log.company_name || <span className="text-gray-300">—</span>}
                  </td>
                )}
                <td className="px-5 py-3.5 text-xs text-gray-700 max-w-xs truncate" title={log.description}>
                  {log.description || "-"}
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-400">
                  {log.ip_address
                    ? log.ip_address.replace(/^::ffff:/, "").replace(/^::1$/, "127.0.0.1")
                    : "-"}
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && (
          <div className="py-12 text-center text-gray-400 text-sm">Loading logs...</div>
        )}
        {!loading && logs.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <ScrollText size={28} className="mx-auto mb-2 text-gray-300" />
            <p>No log entries found</p>
          </div>
        )}
      </div>

      {!loading && (
        <p className="text-xs text-gray-400 mt-3 text-center">Showing {logs.length} log entries</p>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-lg text-white text-sm z-50 ${
          toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
