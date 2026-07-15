import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench } from "lucide-react";
import api from "../services/api";

export default function Maintenance() {
  const navigate = useNavigate();

  const tryAgain = async () => {
    try {
      // Probe a lightweight endpoint; if maintenance is off, it will succeed
      await api.get("/dashboard/stats");
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.status !== 503) {
        // Maintenance mode is off (got a different error like 401) — go to login
        navigate("/login");
      }
      // Still 503 → stay on this page (the interceptor won't redirect again
      // because we're already on /maintenance)
    }
  };

  // Periodically re-check so the page auto-recovers when admin lifts maintenance
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        await api.get("/dashboard/stats");
        navigate("/dashboard");
      } catch { /* still in maintenance or unauthenticated — ignore */ }
    }, 30_000);
    return () => clearInterval(id);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 max-w-md w-full">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Wrench size={32} className="text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Under Maintenance</h1>
        <p className="text-gray-500 text-sm mb-6">
          The system is temporarily unavailable while our administrators perform scheduled
          maintenance. Please check back shortly.
        </p>
        <button
          onClick={tryAgain}
          className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition-colors"
        >
          Try Again
        </button>
        <p className="text-xs text-gray-400 mt-4">Page auto-refreshes every 30 seconds</p>
      </div>
    </div>
  );
}
