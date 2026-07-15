import { useState, useEffect } from "react";
import { Users, Plus, Search, Download, Edit2, Trash2, X, CheckCircle, Mail, Briefcase, DollarSign } from "lucide-react";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from "../services/employeesService";
import { exportToCSV } from "../utils/exportCSV";
import { useSystem } from "../context/SystemContext";

const BLANK = { name: "", email: "", position: "", salary: "", department: "Engineering", status: "Active" };
const DEPTS = ["Engineering", "Sales", "Marketing", "Support", "HR", "Finance", "Operations"];
const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
    <CheckCircle size={16} /> {msg}
    <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
  </div>
);

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const { t } = useSystem();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try { const { data } = await getEmployees(); setEmployees(data); } catch {}
  };
  useEffect(() => { load(); }, []);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const openAdd = () => { setEditing(null); setForm(BLANK); setShowModal(true); };
  const openEdit = (emp) => {
    setEditing(emp);
    setForm({ name: emp.name, email: emp.email, position: emp.position, salary: emp.salary ?? "", department: emp.department || "Engineering", status: emp.status || "Active" });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (editing) { await updateEmployee(editing.id, form); showToast("Employee updated successfully!"); }
      else { await createEmployee(form); showToast("Employee added successfully!"); }
      setShowModal(false); load();
    } catch { showToast("Operation failed. Please try again.", "error"); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    try { await deleteEmployee(deleteId); showToast("Employee removed."); setDeleteId(null); load(); }
    catch { showToast("Delete failed.", "error"); setDeleteId(null); }
  };

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const filtered = employees.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      (e.position || "").toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || (e.department || "Engineering") === deptFilter;
    return matchSearch && matchDept;
  });

  const handleExport = () => {
    exportToCSV(filtered.map((e) => ({ Name: e.name, Email: e.email, Position: e.position, Department: e.department || "", Salary: e.salary ?? "", Status: e.status || "Active" })), "employees");
  };

  const fmt = (v) => v != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v) : "—";
  const avgSalary = employees.length ? Math.round(employees.reduce((a, e) => a + (Number(e.salary) || 0), 0) / employees.length) : 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t("Employees")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("Manage your team members and their information")}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={15} /> Export CSV
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition-colors">
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {[
          { label: "Total Employees", value: employees.length, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Active", value: employees.filter((e) => e.status !== "Inactive").length, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
          { label: "Departments", value: new Set(employees.map((e) => e.department || "Engineering")).size, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Avg. Salary", value: fmt(avgSalary), icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{label}</p>
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon size={17} className={color} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative w-full sm:flex-1 sm:max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name, email, or position..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-1 bg-white border border-gray-100 rounded-xl p-1">
          {["All", ...DEPTS.slice(0, 5)].map((d) => (
            <button key={d} onClick={() => setDeptFilter(d)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${deptFilter === d ? "bg-violet-600 text-white" : "text-gray-500 hover:text-gray-700"}`}>{d}</button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-100">
              {["Employee", "Position", "Department", "Salary", "Status", "Actions"].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp, idx) => (
              <tr key={emp.id} className={`${idx !== filtered.length - 1 ? "border-b border-gray-50" : ""} hover:bg-gray-50/50 transition-colors`}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-violet-600">{emp.name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1"><Mail size={10} /> {emp.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-700">{emp.position || "—"}</td>
                <td className="px-5 py-4">
                  <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">{emp.department || "Engineering"}</span>
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-gray-900">{fmt(emp.salary)}</td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${emp.status === "Inactive" ? "bg-gray-100 text-gray-500" : "bg-green-50 text-green-600"}`}>{emp.status || "Active"}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(emp)} className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="Edit"><Edit2 size={14} /></button>
                    <button onClick={() => setDeleteId(emp.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-14 text-center">
            <Users size={30} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No employees found</p>
            <p className="text-sm text-gray-400 mt-1">{search ? "Try a different search term" : "Click \"Add Employee\" to get started"}</p>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-3">Showing {filtered.length} of {employees.length} employees</p>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 overflow-y-auto py-4 sm:py-8 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto my-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editing ? "Edit Employee" : "Add Employee"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input required className={inputCls} placeholder="John Doe" value={form.name} onChange={set("name")} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input type="email" required className={inputCls} placeholder="john@company.com" value={form.email} onChange={set("email")} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Position</label>
                  <input required className={inputCls} placeholder="e.g. Engineer" value={form.position} onChange={set("position")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Salary (USD)</label>
                  <input type="number" className={inputCls} placeholder="75000" value={form.salary} onChange={set("salary")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                  <select className={inputCls} value={form.department} onChange={set("department")}>
                    {DEPTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select className={inputCls} value={form.status} onChange={set("status")}>
                    <option>Active</option><option>Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60">
                  {loading ? "Saving..." : editing ? "Save Changes" : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500" /></div>
            <h3 className="font-bold text-gray-900 mb-1">Delete Employee?</h3>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Employees;
