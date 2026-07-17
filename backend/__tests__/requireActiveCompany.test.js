jest.mock("../config/db", () => ({ query: jest.fn() }));

const express = require("express");
const request = require("supertest");
const db = require("../config/db");
const requireActiveCompany = require("../middleware/requireActiveCompany");

const buildApp = (companyId) => {
  const app = express();
  app.get("/protected", (req, res, next) => {
    req.user = companyId === undefined ? { role: "super_admin" } : { company_id: companyId };
    next();
  }, requireActiveCompany, (req, res) => res.json({ ok: true }));
  return app;
};

describe("requireActiveCompany", () => {
  beforeEach(() => {
    db.query.mockReset();
    requireActiveCompany.invalidateCache();
  });

  it("blocks a request from a user whose company is suspended", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 42 }] }); // suspended company ids
    const res = await request(buildApp(42)).get("/protected");
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("COMPANY_SUSPENDED");
  });

  it("lets a request through when the user's company isn't in the suspended set", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 999 }] }); // some other company is suspended
    const res = await request(buildApp(42)).get("/protected");
    expect(res.status).toBe(200);
  });

  it("never queries the database for a super_admin (no company_id)", async () => {
    const res = await request(buildApp(undefined)).get("/protected");
    expect(res.status).toBe(200);
    expect(db.query).not.toHaveBeenCalled();
  });

  it("caches the suspended-id lookup instead of querying on every request", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await request(buildApp(42)).get("/protected");
    await request(buildApp(42)).get("/protected");
    expect(db.query).toHaveBeenCalledTimes(1);
  });
});
