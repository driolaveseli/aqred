import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Home",          to: "/" },
  { label: "Features",      to: "/features" },
  { label: "About",         to: "/about" },
  { label: "Documentation", to: "/documentation" },
  { label: "Contact",       to: "/contact" },
];

const PublicNavbar = () => {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center shadow-sm shadow-violet-300/40">
            <span className="text-white text-sm font-black select-none">A</span>
          </div>
          <span className="text-[17px] leading-none select-none">
            <span className="font-extrabold tracking-tight text-slate-800 dark:text-white">Aq</span>
            <span className="font-extrabold tracking-tight text-violet-600">red</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className={`text-sm font-medium transition-colors ${
                isActive(to)
                  ? "text-violet-600"
                  : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-medium text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-sm shadow-violet-300/30"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile: hamburger + login */}
        <div className="flex md:hidden items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Login
          </Link>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 pb-4">
          <nav className="flex flex-col gap-1 pt-2">
            {NAV_LINKS.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(to)
                    ? "bg-violet-50 dark:bg-violet-900/20 text-violet-600"
                    : "text-slate-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              to="/register"
              onClick={() => setMobileOpen(false)}
              className="mt-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition-colors text-center"
            >
              Get Started
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;
