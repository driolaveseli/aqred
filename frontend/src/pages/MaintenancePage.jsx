import { Settings, AlertTriangle } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white border border-gray-100 rounded-2xl p-10 max-w-md w-full text-center shadow-sm">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Settings size={30} className="text-amber-500" style={{ animation: "spin 3s linear infinite" }} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Under Maintenance</h1>
        <p className="text-gray-500 text-sm mb-6">
          The system is currently undergoing scheduled maintenance.<br />
          Please check back shortly.
        </p>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 text-amber-700 text-xs rounded-xl px-4 py-3 text-left">
          <AlertTriangle size={14} className="shrink-0" />
          If you need immediate assistance, please contact your system administrator.
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
