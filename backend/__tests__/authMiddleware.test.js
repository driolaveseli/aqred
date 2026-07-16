const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const { verifyToken, requireRole, blockSuperAdmin } = require("../middleware/authMiddleware");

const SECRET = process.env.JWT_SECRET;

const buildApp = (...middleware) => {
  const app = express();
  app.use(cookieParser());
  app.get("/protected", ...middleware, (req, res) => res.json({ ok: true, user: req.user }));
  return app;
};

describe("verifyToken", () => {
  const app = buildApp(verifyToken);

  it("rejects requests with no token", async () => {
    const res = await request(app).get("/protected");
    expect(res.status).toBe(401);
  });

  it("rejects requests with an invalid cookie", async () => {
    const res = await request(app).get("/protected").set("Cookie", ["token=not-a-real-token"]);
    expect(res.status).toBe(401);
  });

  it("accepts a valid token from a cookie and attaches req.user", async () => {
    const token = jwt.sign({ id: 2, role: "employee" }, SECRET, { expiresIn: "1h" });
    const res = await request(app).get("/protected").set("Cookie", [`token=${token}`]);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: 2, role: "employee" });
  });

  it("rejects an expired token", async () => {
    const token = jwt.sign({ id: 1, role: "admin" }, SECRET, { expiresIn: -1 });
    const res = await request(app).get("/protected").set("Cookie", [`token=${token}`]);
    expect(res.status).toBe(401);
  });

  it("ignores an Authorization header — cookie is the only accepted mechanism", async () => {
    const token = jwt.sign({ id: 1, role: "admin" }, SECRET, { expiresIn: "1h" });
    const res = await request(app).get("/protected").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});

describe("requireRole", () => {
  const app = buildApp(verifyToken, requireRole("admin", "manager"));

  it("allows a role in the allow-list", async () => {
    const token = jwt.sign({ id: 1, role: "manager" }, SECRET, { expiresIn: "1h" });
    const res = await request(app).get("/protected").set("Cookie", [`token=${token}`]);
    expect(res.status).toBe(200);
  });

  it("blocks a role not in the allow-list", async () => {
    const token = jwt.sign({ id: 1, role: "employee" }, SECRET, { expiresIn: "1h" });
    const res = await request(app).get("/protected").set("Cookie", [`token=${token}`]);
    expect(res.status).toBe(403);
  });
});

describe("blockSuperAdmin", () => {
  const app = buildApp(verifyToken, blockSuperAdmin);

  it("blocks super_admin from company-scoped routes", async () => {
    const token = jwt.sign({ id: 1, role: "super_admin" }, SECRET, { expiresIn: "1h" });
    const res = await request(app).get("/protected").set("Cookie", [`token=${token}`]);
    expect(res.status).toBe(403);
  });

  it("allows non-super_admin roles through", async () => {
    const token = jwt.sign({ id: 1, role: "admin" }, SECRET, { expiresIn: "1h" });
    const res = await request(app).get("/protected").set("Cookie", [`token=${token}`]);
    expect(res.status).toBe(200);
  });
});
