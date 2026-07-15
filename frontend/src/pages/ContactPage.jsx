import { useState } from "react";
import { Mail, BookOpen, CheckCircle, MessageSquare, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";
import PublicFooter from "../components/PublicFooter";

const inputClass =
  "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", company: "", message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  const handleSubmit = (e) => { e.preventDefault(); setSubmitted(true); };
  const handleReset = () => {
    setSubmitted(false);
    setFormData({ firstName: "", lastName: "", email: "", company: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 font-sans antialiased">
      <PublicNavbar />
      <main className="pt-16">

        {/* Hero */}
        <div className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 pt-24 pb-16 text-center px-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-gray-800 border border-violet-200 dark:border-violet-800 rounded-full mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-violet-600 dark:text-violet-400">Contact</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-violet-700 dark:text-violet-300 leading-tight tracking-tight mb-4">
            Get in touch
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-base leading-relaxed">
            Get in touch with our team for support or inquiries
          </p>
        </div>

        {/* Two-column layout */}
        <div className="max-w-5xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

            {/* Left — contact info panel */}
            <div className="lg:col-span-2">
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-700 p-8 text-white shadow-xl shadow-violet-200/50 dark:shadow-violet-900/30">
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />

                <div className="relative">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-violet-200 mb-6">Contact Info</p>

                  <div className="space-y-6">
                    {/* Email */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Mail size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white mb-1">Email</p>
                        <p className="text-sm text-violet-200">support@aqred.com</p>
                        <p className="text-sm text-violet-200">sales@aqred.com</p>
                      </div>
                    </div>

                    {/* Documentation */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BookOpen size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white mb-1">Documentation</p>
                        <p className="text-sm text-violet-200 mb-2">Browse the full documentation</p>
                        <Link
                          to="/documentation"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-1.5 transition-colors"
                        >
                          Setup guides & API reference <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Bottom note */}
                  <div className="mt-10 pt-6 border-t border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare size={14} className="text-violet-200" />
                      <p className="text-xs font-semibold text-violet-200">Response time</p>
                    </div>
                    <p className="text-xs text-violet-300 leading-relaxed">
                      We typically respond within one business day.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                {/* Gradient top bar */}
                <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

                <div className="p-6 sm:p-8">
                  {submitted ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-green-200 dark:shadow-green-900/30">
                        <CheckCircle size={28} className="text-white" />
                      </div>
                      <h2 className="font-extrabold text-gray-900 dark:text-white text-xl mb-2 tracking-tight">
                        Message sent!
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-xs">
                        We'll get back to you shortly.
                      </p>
                      <button
                        onClick={handleReset}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-md shadow-violet-200 dark:shadow-violet-900/30"
                      >
                        Send another message
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-7">
                        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">
                          Send us a message
                        </h2>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          Fill out the form below and we'll get back to you as soon as possible
                        </p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                              First Name
                            </label>
                            <input
                              type="text"
                              className={inputClass}
                              placeholder="John"
                              value={formData.firstName}
                              onChange={set("firstName")}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                              Last Name
                            </label>
                            <input
                              type="text"
                              className={inputClass}
                              placeholder="Doe"
                              value={formData.lastName}
                              onChange={set("lastName")}
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                            Email
                          </label>
                          <input
                            type="email"
                            className={inputClass}
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={set("email")}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                            Company <span className="text-gray-400 normal-case font-normal">(optional)</span>
                          </label>
                          <input
                            type="text"
                            className={inputClass}
                            placeholder="Your company name"
                            value={formData.company}
                            onChange={set("company")}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                            Message
                          </label>
                          <textarea
                            rows={4}
                            className={inputClass + " resize-none"}
                            placeholder="Tell us how we can help you..."
                            value={formData.message}
                            onChange={set("message")}
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full inline-flex items-center justify-center gap-2 bg-violet-600 text-white rounded-xl px-4 py-3 text-sm font-bold hover:bg-violet-700 active:bg-violet-800 transition-colors shadow-md shadow-violet-200 dark:shadow-violet-900/30"
                        >
                          Send Message <ArrowRight size={15} />
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export default ContactPage;
