import { Link } from "react-router-dom";
import { Compass, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../layouts/DashboardLayout";

const NotFoundContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-300/40 dark:shadow-none">
        <Compass size={28} className="text-white" />
      </div>
      <p className="text-7xl font-black bg-gradient-to-br from-violet-600 to-indigo-600 bg-clip-text text-transparent leading-none mb-3">
        404
      </p>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Page not found</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-8">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link
        to={isAuthenticated ? "/dashboard" : "/"}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 active:scale-95 transition-all shadow-lg shadow-violet-500/25"
      >
        {isAuthenticated ? "Back to Dashboard" : "Back to Home"} <ArrowRight size={15} />
      </Link>
    </div>
  );
};

const NotFound = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated
    ? <DashboardLayout><NotFoundContent /></DashboardLayout>
    : <div className="bg-white dark:bg-gray-900 min-h-screen flex items-center"><div className="w-full"><NotFoundContent /></div></div>;
};

export default NotFound;
