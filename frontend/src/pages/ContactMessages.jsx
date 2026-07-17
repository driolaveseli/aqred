import { useState, useEffect } from "react";
import { Mail, Trash2, X, CheckCircle, Building2 } from "lucide-react";
import { useSystem } from "../context/SystemContext";
import EmptyState from "../components/UI/EmptyState";
import PageHeader from "../components/UI/PageHeader";
import useEscapeKey from "../hooks/useEscapeKey";
import { getContactMessages, markContactRead, deleteContactMessage } from "../services/contactService";

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 z-50 animate-toast-in flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === "success" ? "bg-green-50 dark:bg-emerald-900/30 text-green-700 dark:text-emerald-300 border border-green-100 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800"}`}>
    <CheckCircle size={16} /> {msg}
    <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
  </div>
);

const ContactMessages = () => {
  const { formatDate } = useSystem();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getContactMessages();
      setMessages(data);
    } catch {
      showToast("Failed to load messages.", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEscapeKey(!!viewing, () => setViewing(null));
  useEscapeKey(!!deleteId, () => setDeleteId(null));

  const openView = async (m) => {
    setViewing(m);
    if (m.status === "new") {
      try {
        await markContactRead(m.id);
        setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: "read" } : x)));
      } catch { /* not critical if this silently fails */ }
    }
  };

  const handleDelete = async () => {
    try {
      await deleteContactMessage(deleteId);
      showToast("Message deleted.");
      setDeleteId(null);
      load();
    } catch {
      showToast("Delete failed.", "error");
      setDeleteId(null);
    }
  };

  const newCount = messages.filter((m) => m.status === "new").length;

  return (
    <div>
      {/* ── Header ── */}
      <PageHeader
        title="Contact Messages"
        subtitle="Inbound submissions from the public contact form"
        badges={newCount > 0 ? [{ icon: Mail, label: `${newCount} new`, tone: "violet" }] : []}
      />

      {/* ── Table ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {["From", "Company", "Message", "Received"].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
              <th className="px-5 py-3.5 w-10" />
            </tr>
          </thead>
          <tbody>
            {!loading && messages.map((m, idx) => (
              <tr
                key={m.id}
                onClick={() => openView(m)}
                className={`cursor-pointer transition-colors hover:bg-violet-50/40 dark:hover:bg-violet-900/10
                  ${idx !== messages.length - 1 ? "border-b border-gray-50 dark:border-gray-800/60" : ""}`}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {m.status === "new" && <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />}
                    <div>
                      <p className={`text-sm ${m.status === "new" ? "font-bold text-gray-900 dark:text-white" : "font-medium text-gray-600 dark:text-gray-400"}`}>
                        {m.first_name} {m.last_name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{m.company || "—"}</td>
                <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-sm truncate">{m.message}</td>
                <td className="px-5 py-4 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{formatDate(m.created_at)}</td>
                <td className="px-5 py-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteId(m.id); }}
                    className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && (
          <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">Loading messages...</div>
        )}
        {!loading && messages.length === 0 && (
          <EmptyState icon={Mail} title="No messages yet" description="Submissions from the public contact form will show up here." />
        )}
      </div>

      {/* ── View modal ── */}
      {viewing && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setViewing(null); }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">{viewing.first_name} {viewing.last_name}</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{viewing.email}</p>
              </div>
              <button onClick={() => setViewing(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {viewing.company && (
                <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Building2 size={14} className="text-gray-400 dark:text-gray-500" /> {viewing.company}
                </p>
              )}
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{viewing.message}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
                Received {formatDate(viewing.created_at)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {deleteId && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteId(null); }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500 dark:text-red-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Delete message?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-95">Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ContactMessages;
