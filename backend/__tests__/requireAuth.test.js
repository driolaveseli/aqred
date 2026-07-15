const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const requireAuth = require("../middleware/requireAuth");

const SECRET = process.env.JWT_SECRET;

const app = express();
app.get("/protected", requireAuth, (req, res) => res.json({ ok: true, user: req.user }));

describe("requireAuth", () => {
  it("rejects requests with no Authorization header", async () => {
    const res = await request(app).get("/protected");
    expect(res.status).toBe(401);
  });

  it("rejects a malformed Authorization header", async () => {
    const res = await request(app).get("/protected").set("Authorization", "not-bearer token");
    expect(res.status).toBe(401);
  });

  it("rejects an invalid token", async () => {
    const res = await request(app).get("/protected").set("Authorization", "Bearer garbage");
    expect(res.status).toBe(401);
  });

  it("accepts a valid token", async () => {
    const token = jwt.sign({ id: 5, role: "employee" }, SECRET, { expiresIn: "1h" });
    const res = await request(app).get("/protected").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(5);
  });
});
