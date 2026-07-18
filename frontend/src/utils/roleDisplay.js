// Shared between Sidebar (profile card) and Navbar (account menu) so the
// role badge/initials look identical wherever a user's identity shows up.
export const ROLE_CONFIG = {
  super_admin: { label: "Super Admin", badge: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",           dot: "bg-red-500"     },
  admin:       { label: "Admin",       badge: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400", dot: "bg-violet-500"  },
  manager:     { label: "Manager",     badge: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",         dot: "bg-blue-500"    },
  employee:    { label: "Employee",    badge: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
};

export const getInitials = (name = "") => {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};
