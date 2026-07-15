import { Link } from "react-router-dom";

const PublicFooter = () => (
  <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
    <div className="max-w-7xl mx-auto px-6 py-14">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center shadow-sm shadow-violet-300/30">
              <span className="text-white text-sm font-black select-none">A</span>
            </div>
            <span className="text-[17px] leading-none select-none">
              <span className="font-extrabold tracking-tight text-slate-800 dark:text-white">Aq</span>
              <span className="font-extrabold tracking-tight text-violet-600">red</span>
            </span>
          </div>
          <p className="text-sm text-slate-400 dark:text-slate-500 leading-relaxed">
            A unified Management Information System for modern businesses.
          </p>
        </div>

        {/* Product */}
        <div>
          <p className="font-semibold text-slate-900 dark:text-gray-100 mb-4">Product</p>
          <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
            <li><Link to="/features"      className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</Link></li>
            <li><Link to="/documentation" className="hover:text-slate-900 dark:hover:text-white transition-colors">Documentation</Link></li>
            <li><Link to="/register"      className="hover:text-slate-900 dark:hover:text-white transition-colors">Get Started</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <p className="font-semibold text-slate-900 dark:text-gray-100 mb-4">Company</p>
          <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
            <li><Link to="/about"   className="hover:text-slate-900 dark:hover:text-white transition-colors">About</Link></li>
            <li><Link to="/contact" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <p className="font-semibold text-slate-900 dark:text-gray-100 mb-4">Resources</p>
          <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
            <li><Link to="/documentation" className="hover:text-slate-900 dark:hover:text-white transition-colors">API Reference</Link></li>
            <li><Link to="/documentation" className="hover:text-slate-900 dark:hover:text-white transition-colors">User Guide</Link></li>
            <li><Link to="/contact"       className="hover:text-slate-900 dark:hover:text-white transition-colors">Support</Link></li>
          </ul>
        </div>
      </div>
    </div>

    <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-5">
      <p className="text-center text-sm text-slate-400 dark:text-slate-500">
        © {new Date().getFullYear()} Aqred. All rights reserved.
      </p>
    </div>
  </footer>
);

export default PublicFooter;
