jest.mock("../config/db", () => ({ query: jest.fn() }));
jest.mock("../utils/logger", () => ({ logEvent: jest.fn() }));
jest.mock("../middleware/requireActiveCompany", () => ({ invalidateCache: jest.fn() }));
jest.mock("../middleware/maintenanceMode", () => ({ invalidateCache: jest.fn() }));

const express = require("express");
const request = require("supertest");
const db = require("../config/db");
const { logEvent } = require("../utils/logger");
const requireActiveCompany = require("../middleware/requireActiveCompany");
const superAdminRoutes = require("../routes/superAdmin");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => { req.user = { id: 1, name: "Super Admin", role: "super_admin" }; next(); });
  app.use("/super-admin", superAdminRoutes);
  return app;
};

describe("super-admin routes - audit logging (previously these left zero trace)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("logs an event when a company is created", async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })                          // name-taken check
      .mockResolvedValueOnce({ rows: [] })                          // email-taken check
      .mockResolvedValueOnce({ rows: [{ id: 10, name: "Acme" }] })   // insert company
      .mockResolvedValueOnce({ rows: [] })                          // seed role_permissions
      .mockResolvedValueOnce({ rows: [{ id: 20, name: "Jane", email: "jane@acme.com", role: "admin", company_name: "Acme" }] }); // insert admin user

    const res = await request(buildApp()).post("/super-admin/companies").send({
      company_name: "Acme", admin_name: "Jane", admin_email: "jane@acme.com", admin_password: "password123",
    });

    expect(res.status).toBe(201);
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({ module: "super-admin", action: "company_created" }));
  });

  it("logs a WARNING-level event and clears system_logs before deleting the company", async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ name: "Acme" }] }) // fetch name before delete
      .mockResolvedValueOnce({ rows: [] }) // delete system_logs
      .mockResolvedValueOnce({ rows: [] }) // delete payments
      .mockResolvedValueOnce({ rows: [] }) // delete order_items
      .mockResolvedValueOnce({ rows: [] }) // delete orders
      .mockResolvedValueOnce({ rows: [] }) // delete employees
      .mockResolvedValueOnce({ rows: [] }) // delete customers
      .mockResolvedValueOnce({ rows: [] }) // delete products
      .mockResolvedValueOnce({ rows: [] }) // delete suppliers
      .mockResolvedValueOnce({ rows: [] }) // delete users
      .mockResolvedValueOnce({ rows: [] }); // delete companies

    const res = await request(buildApp()).delete("/super-admin/companies/10");

    expect(res.status).toBe(200);
    // system_logs must be cleared before the companies row itself is removed,
    // otherwise the FK from system_logs.company_id blocks the delete
    const sqlCalls = db.query.mock.calls.map(([sql]) => sql);
    const logsDeleteIdx = sqlCalls.findIndex((sql) => sql.includes("DELETE FROM system_logs"));
    const companyDeleteIdx = sqlCalls.findIndex((sql) => sql.includes("DELETE FROM companies"));
    expect(logsDeleteIdx).toBeGreaterThan(-1);
    expect(logsDeleteIdx).toBeLessThan(companyDeleteIdx);
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({ level: "WARNING", action: "company_deleted" }));
  });

  it("suspending a company logs a WARNING and invalidates the requireActiveCompany cache", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 10, name: "Acme", is_active: false }] });

    const res = await request(buildApp()).patch("/super-admin/companies/10/status").send({ is_active: false });

    expect(res.status).toBe(200);
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({ level: "WARNING", action: "company_suspended" }));
    expect(requireActiveCompany.invalidateCache).toHaveBeenCalled();
  });

  it("reactivating a company logs an INFO event", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 10, name: "Acme", is_active: true }] });

    const res = await request(buildApp()).patch("/super-admin/companies/10/status").send({ is_active: true });

    expect(res.status).toBe(200);
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({ level: "INFO", action: "company_reactivated" }));
  });

  it("rejects a status update that isn't a boolean", async () => {
    const res = await request(buildApp()).patch("/super-admin/companies/10/status").send({ is_active: "yes" });
    expect(res.status).toBe(400);
    expect(db.query).not.toHaveBeenCalled();
  });
});

describe("super-admin routes - maintenance mode is exclusively a super_admin control", () => {
  beforeEach(() => jest.clearAllMocks());

  it("logs a WARNING when maintenance mode is enabled platform-wide", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(buildApp()).patch("/super-admin/maintenance-mode").send({ enabled: true });
    expect(res.status).toBe(200);
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({ level: "WARNING", action: "maintenance_mode_toggled" }));
  });
});
