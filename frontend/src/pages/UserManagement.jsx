import { useState, useEffect } from "react";
import { Users, Plus, Search, Shield, UserCheck, User, X, Edit2, Trash2, CheckCircle, Download } from "lucide-react";
import api from "../services/api";
import { exportToCSV } from "../utils/exportCSV";
import { useSystem } from "../context/SystemContext";
import EmptyState from "../components/UI/EmptyState";
import SkeletonLoader from "../components/UI/SkeletonLoader";

const ROLES = ["admin", "manager", "employee"];
const BLANK = { name: "", email: "", password: "", role: "employee" };

const roleConfig = {
  admin: { cls: "bg-red-50 text-red-600", icon: Shield, label: "Admin" },
  manager: { cls: "bg-violet-50 text-violet-600", icon: UserCheck, label: "Manager" },
  employee: { cls: "bg-blue-50 text-blue-600", icon: User, label: "Employee" },
};

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
    <CheckCircle size={16} /> {msg}
    <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
  </div>
);

const UserManagement = () => {
  const { t } = useSystem();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    try {
      const { data } = await api.get("/users");
      setUsers(data);
    } catch {
      showToast("Failed to load users.", "error");
    }
  };

  useEffect(() => { load(); }, []);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const openAdd = () => { setEditing(null); setForm(BLANK); setShowModal(true); };
  const openEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/users/${editing.id}`, form);
        showToast("User updated!");
      } else {
        await api.post("/users", form);
        showToast("User created!");
      }
      setShowModal(false);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Operation failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${deleteId}`);
      showToast("User deleted.");
      setDeleteId(null);
      load();
    } catch {
      showToast("Delete failed.", "error");
      setDeleteId(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () =>
    exportToCSV(
      filtered.map((u) => ({
        Name:    u.name,
        Email:   u.email,
        Role:    u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "",
        Company: u.company_name || "",
        Created: u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "",
      })),
      "users"
    );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t("User Management")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("Manage system users, roles, and access")}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 active:scale-95 transition-all">
            <Download size={15} /> {t("Export CSV")}
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 active:scale-95 transition-all">
            <Plus size={16} /> {t("Add User")}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: t("Total Users"), value: users.length, color: "text-gray-900" },
          { label: t("Admins"), value: users.filter((u) => u.role === "admin").length, color: "text-red-600" },
          { label: t("Managers"), value: users.filter((u) => u.role === "manager").length, color: "text-violet-600" },
          { label: t("Employees"), value: users.filter((u) => u.role === "employee").length, color: "text-blue-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
          className="w-full sm:max-w-xs pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="border-b border-gray-100">
              {[t("User"), t("Role"), t("Company"), t("Created"), t("Actions")].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, idx) => {
              const cfg = roleConfig[u.role] || roleConfig.employee;
              const RoleIcon = cfg.icon;
              return (
                <tr key={u.id} className={`hover:bg-violet-50/30 transition-colors ${idx !== filtered.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-violet-600">{u.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full capitalize ${cfg.cls}`}>
                      <RoleIcon size={11} /> {t(cfg.label)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{u.company_name || "—"}</td>
                  <td className="px-5 py-4 text-xs text-gray-400">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setDeleteId(u.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        {filtered.length === 0 && (
          <EmptyState
            icon={Users}
            title={t("No users found")}
            description={search ? t("Try a different search term") : t("Add your first user to manage system access.")}
            actionLabel={!search ? t("Add User") : undefined}
            onAction={!search ? openAdd : undefined}
          />
        )}
      </div>
      <p className="text-xs text-gray-400 mt-3">{t("Showing")} {filtered.length} {t("of")} {users.length} {t("users")}</p>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editing ? t("Edit User") : t("Add User")}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("Full Name")}</label>
                <input type="text" required className={inputCls} placeholder="John Doe" value={form.name} onChange={set("name")} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("Email")}</label>
                <input type="email" required className={inputCls} placeholder="john@company.com" value={form.email} onChange={set("email")} />
              </div>
              {!editing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("Password")}</label>
                  <input type="password" required className={inputCls} placeholder="Temporary password" value={form.password} onChange={set("password")} />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("Role")}</label>
                <select className={inputCls} value={form.role} onChange={set("role")}>
                  {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg active:scale-95">{t("Cancel")}</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60 active:scale-95">
                  {loading ? t("Saving...") : editing ? t("Save Changes") : t("Create User")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{t("Delete User?")}</h3>
            <p className="text-sm text-gray-500 mb-5">{t("This action cannot be undone.")}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95">{t("Cancel")}</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-95">{t("Delete")}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default UserManagement;
