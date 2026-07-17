import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import { AuthProvider } from "../context/AuthContext";

jest.mock("../services/api", () => ({
  post: jest.fn().mockResolvedValue({}),
}));

const renderWithUser = (user, ui, { route = "/" } = {}) => {
  if (user) localStorage.setItem("mis_user", JSON.stringify(user));
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/" element={<div>Home page</div>} />
          <Route path="/super-admin/companies" element={<div>Super admin home</div>} />
          <Route path="/protected" element={ui} />
          <Route path="/change-password" element={ui} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("PrivateRoute", () => {
  it("redirects unauthenticated users to /login", () => {
    renderWithUser(null, <PrivateRoute>secret</PrivateRoute>, { route: "/protected" });
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders children for an authenticated user", () => {
    renderWithUser(
      { id: 1, role: "employee", permissions: [] },
      <PrivateRoute>secret</PrivateRoute>,
      { route: "/protected" }
    );
    expect(screen.getByText("secret")).toBeInTheDocument();
  });

  it("blocks a role missing from allowedRoles", () => {
    renderWithUser(
      { id: 1, role: "employee", permissions: [] },
      <PrivateRoute allowedRoles={["admin"]}>secret</PrivateRoute>,
      { route: "/protected" }
    );
    expect(screen.getByText("Home page")).toBeInTheDocument();
  });

  it("blocks access when the required permission is missing", () => {
    renderWithUser(
      { id: 1, role: "manager", permissions: ["dashboard"] },
      <PrivateRoute permission="administration">secret</PrivateRoute>,
      { route: "/protected" }
    );
    expect(screen.getByText("Home page")).toBeInTheDocument();
  });

  it("redirects super_admin away from non-super-admin routes", () => {
    renderWithUser(
      { id: 1, role: "super_admin", permissions: [] },
      <PrivateRoute>secret</PrivateRoute>,
      { route: "/protected" }
    );
    expect(screen.getByText("Super admin home")).toBeInTheDocument();
  });

  it("lets a super_admin with a pending forced password change land on /change-password (regression: used to bounce back and forth forever)", () => {
    renderWithUser(
      { id: 1, role: "super_admin", permissions: [], mustChangePassword: true },
      <PrivateRoute>secret</PrivateRoute>,
      { route: "/change-password" }
    );
    expect(screen.getByText("secret")).toBeInTheDocument();
  });
});
