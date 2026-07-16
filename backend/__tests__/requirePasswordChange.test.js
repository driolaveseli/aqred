const express = require("express");
const request = require("supertest");
const requirePasswordChange = require("../middleware/requirePasswordChange");

const buildApp = () => {
  const app = express();
  app.get("/protected", (req, res, next) => {
    req.user = req.headers["x-must-change"] === "1" ? { mustChangePassword: true } : { mustChangePassword: false };
    next();
  }, requirePasswordChange, (req, res) => res.json({ ok: true }));
  return app;
};

describe("requirePasswordChange", () => {
  const app = buildApp();

  it("blocks a request when the user still has mustChangePassword set", async () => {
    const res = await request(app).get("/protected").set("x-must-change", "1");
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("MUST_CHANGE_PASSWORD");
  });

  it("lets a request through once mustChangePassword is cleared", async () => {
    const res = await request(app).get("/protected").set("x-must-change", "0");
    expect(res.status).toBe(200);
  });
});
