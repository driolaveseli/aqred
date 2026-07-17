import { useState, useEffect, useCallback } from "react";
import {
  Building2, Plus, Users, ShieldCheck, Trash2, X, Eye,
  CheckCircle, UserPlus, ChevronDown, ChevronUp, Ban, RotateCcw,
} from "lucide-react";
import {
  getCompanies, createCompany, assignAdmin, getCompanyUsers, setCompanyStatus, deleteCompany,
} from "../services/superAdminService";
import useEscapeKey from "../hooks/useEscapeKey";
import PageHeader from "../components/UI/PageHeader";

const inputCls =
  "w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";

const ROLE_COLORS = {
  admin:    "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
  manager:  "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400",
  employee: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
};

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 z-50 animate-toast-in flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === "success" ? "bg-green-50 dark:bg-emerald-900/30 text-green-700 dark:text-emerald-300 border border-green-100 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800"}`}>
    <CheckCircle size={16} /> {msg}
    <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
  </div>
);

const CompanyManagement = () => {
  const [companies, setCompanies]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [toast, setToast]               = useState(null);
  const [expandedId, setExpandedId]     = useState(null);
  const [companyUsers, setCompanyUsers] = useState({});

  // Modal state
  const [modal, setModal] = useState(null); // null | "create" | "assign"
  const [targetCompany, setTargetCompany] = useState(null);
  const [deleteId, setDeleteId]         = useState(null);
  const [submitting, setSubmitting]     = useState(false);

  // Form state
  const [form, setForm] = useState({
    company_name: "", admin_name: "", admin_email: "", admin_password: "",
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      const { data } = await getCompanies();
      setCompanies(data);
    } catch {
      showToast("Failed to load companies.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({ company_name: "", admin_name: "", admin_email: "", admin_password: "" });
    setModal("create");
  };

  const openAssign = (company) => {
    setTargetCompany(company);
    setForm({ company_name: "", admin_name: "", admin_email: "", admin_password: "" });
    setModal("assign");
  };

  const closeModal = () => { setModal(null); setTargetCompany(null); };

  useEscapeKey(!!modal, closeModal);
  useEscapeKey(!!deleteId, () => setDeleteId(null));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modal === "create") {
        await createCompany(form);
        showToast(`Company "${form.company_name}" created with admin account.`);
      } else {
        await assignAdmin(targetCompany.id, {
          name: form.admin_name, email: form.admin_email, password: form.admin_password,
        });
        showToast(`Admin assigned to "${targetCompany.name}".`);
      }
      closeModal();
      load();
    } catch (err) {
      showToast(err.response?.data?.error || "Operation failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!companyUsers[id]) {
      try {
        const { data } = await getCompanyUsers(id);
        setCompanyUsers((prev) => ({ ...prev, [id]: data }));
      } catch {
        setCompanyUsers((prev) => ({ ...prev, [id]: [] }));
      }
    }
  };

  const handleToggleStatus = async (co) => {
    if (co.is_active && !window.confirm(`Suspend "${co.name}"? Its users won't be able to sign in until you reactivate it.`))
      return;
    try {
      await setCompanyStatus(co.id, !co.is_active);
      showToast(co.is_active ? `"${co.name}" suspended.` : `"${co.name}" reactivated.`);
      load();
    } catch (err) {
      showToast(err.response?.data?.error || "Update failed.", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCompany(deleteId);
      showToast("Company and all its data deleted.");
      setDeleteId(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.error || "Delete failed.", "error");
      setDeleteId(null);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Company Management"
        subtitle="Platform-level control — create companies and assign their administrators"
        badges={[{ icon: Building2, label: `${companies.length} companies`, tone: "violet" }]}
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 self-start sm:self-auto"
          >
            <Plus size={16} /> New Company
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6">
        {[
          { label: "Total Companies", value: companies.length, color: "text-violet-600 dark:text-violet-400" },
          { label: "Total Users",     value: companies.reduce((s, c) => s + parseInt(c.user_count || 0), 0), color: "text-blue-600 dark:text-blue-400" },
          { label: "With Admin",      value: companies.filter((c) => c.admin_email).length, color: "text-green-600 dark:text-emerald-400" },
          { label: "Suspended",      value: companies.filter((c) => !c.is_active).length, color: "text-red-600 dark:text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Company List */}
      <div className="space-y-3">
        {companies.length === 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-12 text-center">
            <Building2 size={36} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No companies yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Click "New Company" to create the first one.</p>
          </div>
        )}

        {companies.map((co) => (
          <div key={co.id} className={`bg-white dark:bg-gray-900 border rounded-2xl overflow-hidden ${
            co.is_active ? "border-gray-100 dark:border-gray-800" : "border-red-200 dark:border-red-900/50"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4">
              {/* Company icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                co.is_active ? "bg-violet-100 dark:bg-violet-900/30" : "bg-red-100 dark:bg-red-900/30"
              }`}>
                <Building2 size={18} className={co.is_active ? "text-violet-600 dark:text-violet-400" : "text-red-500 dark:text-red-400"} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 dark:text-white">{co.name}</p>
                  {!co.is_active && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50">
                      <Ban size={9} /> Suspended
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <Users size={11} /> {co.user_count} user{co.user_count !== "1" ? "s" : ""}
                  </span>
                  {co.admin_email ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-emerald-400">
                      <ShieldCheck size={11} /> {co.admin_name} · {co.admin_email}
                    </span>
                  ) : (
                    <span className="text-xs text-amber-500 dark:text-amber-400 font-medium">⚠ No admin assigned</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
                <button
                  onClick={() => toggleExpand(co.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Eye size={13} />
                  {expandedId === co.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <button
                  onClick={() => handleToggleStatus(co)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    co.is_active
                      ? "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      : "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  }`}
                >
                  {co.is_active ? <><Ban size={13} /> Suspend</> : <><RotateCcw size={13} /> Reactivate</>}
                </button>
                <button
                  onClick={() => openAssign(co)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20"
                >
                  <UserPlus size={13} /> Assign Admin
                </button>
                <button
                  onClick={() => setDeleteId(co.id)}
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Expanded user list */}
            {expandedId === co.id && (
              <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-4 bg-gray-50 dark:bg-gray-800/40">
                {!companyUsers[co.id] ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>
                ) : companyUsers[co.id].length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">No users in this company.</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Users</p>
                    {companyUsers[co.id].map((u) => (
                      <div key={u.id} className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg px-3 py-2">
                        <div className="w-7 h-7 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">{u.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{u.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{u.email}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[u.role] || "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create / Assign Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white">
                {modal === "create" ? "Create New Company" : `Assign Admin — ${targetCompany?.name}`}
              </h2>
              <button onClick={closeModal} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {modal === "create" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Company Name</label>
                  <input
                    required autoFocus className={inputCls} placeholder="Acme Corporation"
                    value={form.company_name} onChange={set("company_name")}
                  />
                </div>
              )}

              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                  {modal === "create" ? "Company Administrator Account" : "New Administrator Account"}
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                    <input required autoFocus={modal !== "create"} className={inputCls} placeholder="Jane Doe"
                      value={form.admin_name} onChange={set("admin_name")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                    <input required type="email" className={inputCls} placeholder="admin@acme.com"
                      value={form.admin_email} onChange={set("admin_email")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                    <input required type="password" className={inputCls} placeholder="Strong password"
                      value={form.admin_password} onChange={set("admin_password")} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60">
                  {submitting ? "Creating…" : modal === "create" ? "Create Company" : "Assign Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteId(null); }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500 dark:text-red-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Delete Company?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              This will permanently delete the company and <strong>all</strong> its users, employees, customers, products, orders, and data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
              <button onClick={handleDelete}
                className="flex-1 px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default CompanyManagement;
