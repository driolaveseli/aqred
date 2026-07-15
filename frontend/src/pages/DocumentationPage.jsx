import { useState, useRef } from "react";
import {
  BookOpen, Code2, Shield, Package,
  BarChart2, Users, UserCheck, ShoppingCart,
  DollarSign, FileText, Activity, HelpCircle,
  ChevronDown, ChevronUp,
} from "lucide-react";
import PublicNavbar from "../components/PublicNavbar";
import PublicFooter from "../components/PublicFooter";

// ── Shared primitives ─────────────────────────────────────────────────────────
const SectionHeading = ({ icon: Icon, title, subtitle }) => (
  <div className="mb-7 pb-5 border-b border-gray-100 dark:border-gray-700">
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 rounded-full mb-3">
      <Icon size={12} className="text-violet-500" />
      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-violet-600 dark:text-violet-400">{title}</span>
    </div>
    <p className="text-sm text-gray-400 dark:text-gray-500">{subtitle}</p>
  </div>
);

const H3 = ({ children }) => (
  <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm tracking-tight">{children}</h3>
);

const CodeBlock = ({ children }) => (
  <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl p-5 text-sm text-gray-700 dark:text-gray-300 font-mono overflow-x-auto leading-relaxed whitespace-pre">
    {children}
  </pre>
);

const EndpointRow = ({ method, path, desc }) => (
  <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-3 text-sm mb-2">
    <div className="flex items-center gap-2 font-mono">
      <span className={`font-bold text-xs px-2 py-0.5 rounded flex-shrink-0 ${
        method === "GET"    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
        method === "POST"   ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
        method === "PUT"    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
        "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
      }`}>{method}</span>
      <span className="text-gray-700 dark:text-gray-300">{path}</span>
    </div>
    {desc && <p className="text-gray-400 dark:text-gray-500 mt-1 pl-1 text-xs">{desc}</p>}
  </div>
);

const BulletList = ({ items }) => (
  <ul className="space-y-2">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
        <span className="text-violet-400 mt-0.5 flex-shrink-0">•</span>
        {typeof item === "string" ? item : (
          <span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">{item.name}</span>
            {" — "}{item.desc}
          </span>
        )}
      </li>
    ))}
  </ul>
);

const InfoBox = ({ children }) => (
  <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 rounded-xl p-4 text-sm text-violet-700 dark:text-violet-300 leading-relaxed">
    {children}
  </div>
);

const NoteBox = ({ children }) => (
  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
    {children}
  </div>
);

const StepList = ({ steps }) => (
  <ol className="space-y-4">
    {steps.map((step, i) => (
      <li key={i} className="flex items-start gap-3">
        <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-violet-200 dark:shadow-violet-900/30">
          {i + 1}
        </span>
        <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pt-0.5">{step}</span>
      </li>
    ))}
  </ol>
);

const RoleBadge = ({ role }) => (
  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
    role === "Admin"    ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400" :
    role === "Manager"  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
  }`}>{role}</span>
);

// ── FAQ accordion ─────────────────────────────────────────────────────────────
const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors gap-4"
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{q}</span>
        {open
          ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
          : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed pt-3">{a}</p>
        </div>
      )}
    </div>
  );
};

// ── Tab: Getting Started ──────────────────────────────────────────────────────
const GettingStarted = () => (
  <div className="space-y-8">
    <SectionHeading icon={BookOpen} title="Getting Started" subtitle="Set up your workspace and get your team running" />

    <div>
      <H3>What is Aqred?</H3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
        Aqred is a web-based Management Information System (MIS) that gives businesses a single
        platform to manage employees, customers, products, orders, finances, and analytics.
        It supports multiple user roles with tailored access, real-time data, and enterprise-grade
        security including two-factor authentication and full audit logging.
      </p>
      <InfoBox>
        Aqred is fully web-based — no installation needed. Access it from any browser on any device.
      </InfoBox>
    </div>

    <div>
      <H3>Quick Start — New Admin Setup</H3>
      <StepList steps={[
        "Register your account with your name, email, company name, and a password.",
        "Log in — you will land on the Dashboard with an admin account ready to use.",
        "Go to Administration → Staff and add your employees. Each employee gets their own login.",
        "Go to Administration → Roles & Permissions to review and customize what each role can access.",
        "Add your customers, products, and start creating orders.",
        "Enable Two-Factor Authentication in Settings for added security on admin accounts.",
      ]} />
    </div>

    <div>
      <H3>Logging In</H3>
      <StepList steps={[
        "Navigate to the system URL and click Login in the top navigation bar.",
        "Enter your email address and password, then click Sign In.",
        "If Two-Factor Authentication is enabled on your account, enter the 6-digit code from your authenticator app.",
        "You will be redirected to the Dashboard after successful login.",
      ]} />
      <div className="mt-4">
        <NoteBox>
          If you forget your password, contact your system administrator to reset it.
          Admins can update user credentials from the Administration panel.
        </NoteBox>
      </div>
    </div>

    <div>
      <H3>User Roles</H3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Aqred uses role-based access control. Every user is assigned one of three built-in roles.
        Admins can also create custom roles with specific module-level permissions.
      </p>
      <div className="space-y-3">
        {[
          {
            role: "Admin",
            access: "Full access to all modules — including Administration, user management, role configuration, and system settings.",
          },
          {
            role: "Manager",
            access: "Access to Dashboard, Employee Management, Customer Management, Products, Orders, and Reports. No access to Administration.",
          },
          {
            role: "Employee",
            access: "Dashboard access only. Suitable for staff who need visibility without edit rights.",
          },
        ].map(({ role, access }) => (
          <div key={role} className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl">
            <RoleBadge role={role} />
            <p className="text-sm text-gray-600 dark:text-gray-400">{access}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
        Permission changes take effect on the user's next login.
      </p>
    </div>

    <div>
      <H3>Navigating the System</H3>
      <BulletList items={[
        { name: "Dashboard",       desc: "Overview of key metrics, charts, and recent activity." },
        { name: "Employees",       desc: "Manage employee profiles, departments, salaries, and status." },
        { name: "Customers",       desc: "Customer directory with contact details and linked orders." },
        { name: "Products",        desc: "Product catalog, stock levels, SKUs, and categories." },
        { name: "Orders",          desc: "Create and track orders from placement to completion." },
        { name: "Sales",           desc: "Sales performance overview and revenue tracking." },
        { name: "Invoices",        desc: "Invoice management and payment status tracking." },
        { name: "Reports",         desc: "Analytics dashboards and CSV exports across all modules." },
        { name: "Administration",  desc: "User accounts, role permissions, system logs, and settings. Admin only." },
      ]} />
    </div>
  </div>
);

// ── Tab: Modules ──────────────────────────────────────────────────────────────
const Modules = () => (
  <div className="space-y-8">
    <SectionHeading icon={Package} title="Modules" subtitle="What each module does and who can access it" />

    {[
      {
        icon: BarChart2,
        title: "Dashboard",
        roles: ["Admin", "Manager", "Employee"],
        items: [
          "High-level KPIs: total employees, customers, products, and orders.",
          "Revenue and order trend charts.",
          "Recent activity feed showing the latest system events.",
          "Quick navigation links to key modules.",
        ],
      },
      {
        icon: Users,
        title: "Employee Management",
        roles: ["Admin", "Manager"],
        items: [
          "View all employees in a searchable, filterable table.",
          "Add or edit employee profiles: name, email, position, department, salary, and status.",
          "Filter by department or employment status (Active / Inactive).",
          "Export the full employee list to CSV.",
        ],
      },
      {
        icon: UserCheck,
        title: "Customer Management",
        roles: ["Admin", "Manager"],
        items: [
          "Maintain a complete customer directory with contact and company details.",
          "View all orders linked to each customer.",
          "Add, edit, and manage customer records.",
          "Export customer data to CSV.",
        ],
      },
      {
        icon: Package,
        title: "Products & Inventory",
        roles: ["Admin", "Manager"],
        items: [
          "Manage the product catalog with name, SKU, category, price, and stock level.",
          "Visual indicators for low-stock items.",
          "Add and update products through a modal form.",
          "Export the product list to CSV.",
        ],
      },
      {
        icon: ShoppingCart,
        title: "Orders",
        roles: ["Admin", "Manager"],
        items: [
          "Create orders by linking a customer and employee.",
          "Track order status: Pending, Processing, Completed, Cancelled.",
          "Update order status at any stage.",
          "View order totals and creation dates.",
        ],
      },
      {
        icon: DollarSign,
        title: "Sales & Payments",
        roles: ["Admin", "Manager"],
        items: [
          "Track sales performance and revenue trends.",
          "Monitor payment status across all transactions.",
          "View payment history linked to customers and orders.",
          "Export sales and payment data to CSV.",
        ],
      },
      {
        icon: FileText,
        title: "Invoices",
        roles: ["Admin", "Manager"],
        items: [
          "Manage invoices linked to orders and customers.",
          "Track outstanding and settled invoice balances.",
          "Export invoice records to CSV.",
        ],
      },
      {
        icon: BarChart2,
        title: "Reports & Analytics",
        roles: ["Admin", "Manager"],
        items: [
          "Revenue analytics with visual trend charts.",
          "Customer and order performance reports.",
          "One-click CSV export for any report.",
        ],
      },
      {
        icon: Activity,
        title: "Activity Feed",
        roles: ["Admin", "Manager"],
        items: [
          "Real-time log of all significant actions across the system.",
          "Filter by user, action type, or date range.",
          "Useful for auditing team activity and troubleshooting.",
        ],
      },
    ].map(({ icon: Icon, title, roles, items }) => (
      <div key={title} className="border border-gray-100 dark:border-gray-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Icon size={16} className="text-violet-500" />
            <span className="font-bold text-gray-900 dark:text-white text-sm">{title}</span>
          </div>
          <div className="flex gap-1.5">
            {roles.map((r) => <RoleBadge key={r} role={r} />)}
          </div>
        </div>
        <BulletList items={items} />
      </div>
    ))}
  </div>
);

// ── Tab: Security ─────────────────────────────────────────────────────────────
const Security = () => (
  <div className="space-y-8">
    <SectionHeading icon={Shield} title="Security" subtitle="Authentication, authorization, and data protection" />

    <div>
      <H3>Authentication</H3>
      <BulletList items={[
        { name: "JWT tokens",                    desc: "Issued on login with an 8-hour expiry. Stored client-side in localStorage." },
        { name: "Password hashing",              desc: "All passwords are hashed with bcrypt before storage — plaintext is never saved." },
        { name: "Two-factor authentication",     desc: "Optional per-user TOTP 2FA. Works with any authenticator app (Google Authenticator, Authy, etc.)." },
        { name: "Auto logout",                   desc: "Any 401 Unauthorized response automatically clears the session and redirects to login." },
      ]} />
    </div>

    <div>
      <H3>Authorization</H3>
      <BulletList items={[
        { name: "Role-based access control",     desc: "Every route — frontend and backend — is protected by the user's role." },
        { name: "Dynamic permissions",           desc: "Admins can customize module-level permissions per role. Changes take effect on next login." },
        { name: "Protected built-in roles",      desc: "The admin and super_admin roles cannot be modified or deleted." },
        { name: "Server-side enforcement",       desc: "Backend middleware validates the user's role on every API request — client-side guards alone are not relied on." },
      ]} />
    </div>

    <div>
      <H3>Audit Logging</H3>
      <BulletList items={[
        "All significant actions (logins, record changes, permission updates) are written to system logs.",
        "Each log entry captures the action, the user responsible, their IP address, and a timestamp.",
        "Logs are viewable and exportable by admins under Administration → System Logs.",
      ]} />
    </div>

    <div>
      <H3>How to Enable Two-Factor Authentication</H3>
      <StepList steps={[
        "Go to Settings from the top navigation bar.",
        "Under the Security section, click Enable Two-Factor Authentication.",
        "Scan the QR code with your authenticator app (Google Authenticator, Authy, or similar).",
        "Enter the 6-digit code shown in your app to confirm setup.",
        "On your next login, you will be prompted for this code after entering your password.",
      ]} />
    </div>

    <div>
      <H3>Best Practices</H3>
      <BulletList items={[
        "Enable 2FA on all admin accounts.",
        "Use a strong, unique password for every user account.",
        "Review System Logs regularly to spot unexpected activity.",
        "Assign users the minimum role required for their responsibilities.",
        "Remove or deactivate accounts for staff who have left the organization.",
      ]} />
    </div>
  </div>
);

// ── Tab: API Reference ────────────────────────────────────────────────────────
const APIReference = () => (
  <div className="space-y-8">
    <SectionHeading icon={Code2} title="API Reference" subtitle="RESTful API — base URL: /api" />

    <InfoBox>
      All protected endpoints require a Bearer token in the Authorization header:{" "}
      <span className="font-mono">Authorization: Bearer &lt;token&gt;</span>
    </InfoBox>

    <div>
      <H3>Authentication</H3>
      <EndpointRow method="POST" path="/auth/register" desc="Register a new user account (name, email, password, company_name)." />
      <EndpointRow method="POST" path="/auth/login"    desc="Authenticate with email + password. Returns a JWT, or a tempToken if 2FA is enabled." />
      <EndpointRow method="POST" path="/auth/2fa/verify" desc="Complete 2FA login — submit the tempToken and 6-digit TOTP code to receive the final JWT." />
    </div>

    <div>
      <H3>Employees</H3>
      <EndpointRow method="GET"    path="/employees"      desc="List all employees for the authenticated company." />
      <EndpointRow method="POST"   path="/employees"      desc="Create or update an employee record (upsert by email)." />
      <EndpointRow method="PUT"    path="/employees/:id"  desc="Update an existing employee by ID." />
      <EndpointRow method="DELETE" path="/employees/:id"  desc="Remove an employee record." />
    </div>

    <div>
      <H3>Customers</H3>
      <EndpointRow method="GET"    path="/customers"      desc="List all customers for the authenticated company." />
      <EndpointRow method="POST"   path="/customers"      desc="Add a new customer." />
      <EndpointRow method="PUT"    path="/customers/:id"  desc="Update a customer record." />
      <EndpointRow method="DELETE" path="/customers/:id"  desc="Remove a customer." />
    </div>

    <div>
      <H3>Products</H3>
      <EndpointRow method="GET"    path="/products"       desc="List all products for the authenticated company." />
      <EndpointRow method="POST"   path="/products"       desc="Add a new product to the catalog." />
      <EndpointRow method="PUT"    path="/products/:id"   desc="Update product details or stock level." />
      <EndpointRow method="DELETE" path="/products/:id"   desc="Remove a product." />
    </div>

    <div>
      <H3>Orders</H3>
      <EndpointRow method="GET"  path="/orders"       desc="List all orders for the authenticated company." />
      <EndpointRow method="POST" path="/orders"       desc="Create a new order linked to a customer and employee." />
      <EndpointRow method="PUT"  path="/orders/:id"   desc="Update order details or status." />
    </div>

    <div>
      <H3>Roles & Permissions</H3>
      <EndpointRow method="GET"    path="/roles"        desc="List all roles and their current permission sets." />
      <EndpointRow method="PUT"    path="/roles/:role"  desc="Update the permission set for a specific role. Admin only." />
      <EndpointRow method="POST"   path="/roles"        desc="Create a new custom role with a defined permission set. Admin only." />
      <EndpointRow method="DELETE" path="/roles/:role"  desc="Delete a custom role. Built-in roles (admin, super_admin) cannot be deleted." />
    </div>

    <div>
      <H3>Response Format</H3>
      <BulletList items={[
        { name: "200 OK",           desc: "Request succeeded. Data returned in the response body." },
        { name: "201 Created",      desc: "Resource successfully created." },
        { name: "400 Bad Request",  desc: "Invalid or missing parameters in the request." },
        { name: "401 Unauthorized", desc: "Missing or expired token. The client is logged out automatically." },
        { name: "403 Forbidden",    desc: "Authenticated but not authorized for this action." },
        { name: "404 Not Found",    desc: "The requested resource does not exist." },
        { name: "500 Server Error", desc: "An unexpected error occurred on the server." },
      ]} />
    </div>

    <div>
      <H3>Example: Login</H3>
      <CodeBlock>{`POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "yourpassword"
}

// ── Response (no 2FA) ──
{
  "token": "<jwt>",
  "user": { "id": 1, "name": "Jane", "role": "admin" }
}

// ── Response (2FA enabled) ──
{
  "requires2FA": true,
  "tempToken": "<short-lived-token>"
}`}</CodeBlock>
    </div>

    <div>
      <H3>Example: Authenticated Request</H3>
      <CodeBlock>{`GET /api/employees
Authorization: Bearer <your-jwt-token>

// ── Response ──
[
  {
    "id": 1,
    "name": "John Smith",
    "email": "john@example.com",
    "position": "Engineer",
    "department": "Engineering",
    "salary": 60000,
    "status": "active"
  },
  ...
]`}</CodeBlock>
    </div>
  </div>
);

// ── Tab: FAQ ──────────────────────────────────────────────────────────────────
const FAQ = () => (
  <div className="space-y-6">
    <SectionHeading icon={HelpCircle} title="FAQ" subtitle="Frequently asked questions" />

    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Account & Access</p>
      <div className="space-y-2">
        <FAQItem
          q="How do I reset a user's password?"
          a="Admins can update any user's password from the Administration → Staff panel. Select the user, click Edit, and enter a new password. The user should change it themselves after first login."
        />
        <FAQItem
          q="How do I enable Two-Factor Authentication?"
          a="Go to Settings from the top navigation bar. Under Security, click Enable Two-Factor Authentication and follow the setup steps. You will need an authenticator app such as Google Authenticator or Authy."
        />
        <FAQItem
          q="What happens if I lose access to my 2FA device?"
          a="Contact your system administrator. An admin can disable 2FA on your account from the Administration panel so you can log in and re-enroll with a new device."
        />
        <FAQItem
          q="Why can a user not see certain modules?"
          a="Module visibility is controlled by the user's role. If a user cannot see a module they should have access to, check their assigned role under Administration → Staff, and review the role's permissions under Administration → Roles & Permissions. Permission changes take effect on the user's next login."
        />
        <FAQItem
          q="Can I create custom roles beyond Admin, Manager, and Employee?"
          a="Yes. Go to Administration → Roles & Permissions and click New Role. Give the role a name and select which modules it can access. The new role will appear alongside the built-in roles and can be assigned to any user."
        />
      </div>
    </div>

    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Data & Records</p>
      <div className="space-y-2">
        <FAQItem
          q="How do I export data to CSV?"
          a="Most modules have an Export button in the top-right area of the table view. Click it to download the current filtered view as a CSV file. This works for Employees, Customers, Products, Orders, Invoices, and Reports."
        />
        <FAQItem
          q="Can I import data in bulk?"
          a="Bulk CSV import is not currently available. Records must be added individually through each module's Add form. For large data migrations, contact your administrator."
        />
        <FAQItem
          q="What does 'status: inactive' mean for an employee?"
          a="Setting an employee's status to Inactive marks them as no longer active in the system without deleting their record. Their history is preserved. If they have a user account, that account remains functional unless separately deactivated."
        />
        <FAQItem
          q="How is an order total calculated?"
          a="The order total is set when the order is created and can be updated when editing the order. It is not automatically recalculated from product prices — it is a manual or externally calculated value entered during order creation."
        />
      </div>
    </div>

    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">System & Settings</p>
      <div className="space-y-2">
        <FAQItem
          q="How do I switch between light and dark mode?"
          a="Open Settings from the top navigation bar. Under Appearance, toggle the Dark Mode switch. The setting is saved to your browser and applies immediately."
        />
        <FAQItem
          q="How do I view system activity logs?"
          a="Go to Administration → System Logs. The log shows all significant actions (logins, record changes, permission updates) with the user, IP address, and timestamp. Logs can be filtered and exported to CSV."
        />
        <FAQItem
          q="How long does a login session last?"
          a="Sessions are valid for 8 hours from the time of login. After expiry, you will be automatically redirected to the login page and must sign in again."
        />
        <FAQItem
          q="Are there multiple companies in one system?"
          a="Yes. Aqred is multi-tenant. Each registered company has its own isolated workspace — employees, customers, products, and orders are completely separate between companies."
        />
      </div>
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "start",    label: "Getting Started", Content: GettingStarted },
  { id: "modules",  label: "Modules",         Content: Modules },
  { id: "security", label: "Security",        Content: Security },
  { id: "api",      label: "API Reference",   Content: APIReference },
  { id: "faq",      label: "FAQ",             Content: FAQ },
];

const DocumentationPage = () => {
  const [activeTab, setActiveTab] = useState("start");
  const panelRef = useRef(null);
  const { Content } = TABS.find((t) => t.id === activeTab);

  const switchTab = (id) => {
    setActiveTab(id);
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 font-sans antialiased">
      <PublicNavbar />
      <main className="pt-16">

        {/* Hero */}
        <div className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 pt-24 pb-16 text-center px-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 rounded-full mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-indigo-600 dark:text-indigo-400">Documentation</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-violet-700 dark:text-violet-300 leading-tight tracking-tight mb-4">
            Everything you need to use Aqred
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-base leading-relaxed">
            Guides, module references, API docs, and answers to common questions — all in one place.
          </p>
        </div>

        <div className="max-w-3xl mx-auto px-6 pb-24">
          {/* Tabs */}
          <div className="flex overflow-x-auto bg-gray-100 dark:bg-gray-800 rounded-2xl p-1.5 mb-8 gap-1 shadow-inner">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`flex-shrink-0 py-2 px-4 text-sm font-semibold rounded-xl transition-all duration-150 ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content panel */}
          <div
            ref={panelRef}
            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Gradient top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />
            <div className="p-6 sm:p-8">
              <Content />
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export default DocumentationPage;
