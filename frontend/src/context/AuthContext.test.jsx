import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";

jest.mock("../services/api", () => ({
  post: jest.fn().mockResolvedValue({}),
}));

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("AuthContext", () => {
  it("starts unauthenticated when there is no stored user", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("login stores the user and flips isAuthenticated", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login({ id: 1, role: "admin", permissions: ["dashboard"] });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toMatchObject({ id: 1, role: "admin" });
    expect(JSON.parse(localStorage.getItem("mis_user"))).toMatchObject({ id: 1 });
  });

  it("login with remember=false stores in sessionStorage, not localStorage", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login({ id: 2, role: "employee" }, false);
    });

    expect(sessionStorage.getItem("mis_user")).not.toBeNull();
    expect(localStorage.getItem("mis_user")).toBeNull();
  });

  it("logout clears the user from both storages", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login({ id: 1, role: "admin" });
    });
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("mis_user")).toBeNull();
  });

  it("hasPermission checks the user's permissions array", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login({ id: 1, role: "manager", permissions: ["reports"] });
    });

    expect(result.current.hasPermission("reports")).toBe(true);
    expect(result.current.hasPermission("administration")).toBe(false);
  });
});
