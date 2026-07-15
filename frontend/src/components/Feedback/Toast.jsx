import React from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";

const Toast = ({ message, type = "success", onClose }) => (
  <div
    className={`fixed top-6 right-6 flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg border animate-in slide-in-from-right duration-300 ${
      type === "success"
        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
        : "bg-red-50 border-red-200 text-red-800"
    }`}
  >
    {type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
    <p className="font-semibold">{message}</p>
    <button onClick={onClose}>
      <X size={18} />
    </button>
  </div>
);

export default Toast;
