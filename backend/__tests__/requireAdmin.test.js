const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const requireAdmin = require("../middleware/requireAdmin");

const SECRET = process.env.JWT_SECRET;

const app = express();
app.get("/protected", requireAdmin, (req, res) => res.json({ ok: true }));

describe("requireAdmin", () => {
  it("rejects requests with no token", async () => {
    const res = await request(app).get("/protected");
    expect(res.status).toBe(401);
  });

  it("rejects a non-admin role", async () => {
    const token = jwt.sign({ id: 1, role: "employee" }, SECRET, { expiresIn: "1h" });
    const res = await request(app).get("/protected").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("accepts an admin role", async () => {
    const token = jwt.sign({ id: 1, role: "admin" }, SECRET, { expiresIn: "1h" });
    const res = await request(app).get("/protected").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
