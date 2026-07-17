jest.mock("../config/db", () => ({ query: jest.fn() }));
jest.mock("../utils/logger", () => ({ logEvent: jest.fn() }));

const express = require("express");
const request = require("supertest");
const bcrypt = require("bcrypt");
const db = require("../config/db");
const authController = require("../controllers/authController");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.post("/login", authController.login);
  return app;
};

describe("login - timing-safe email enumeration fix", () => {
  afterEach(() => jest.restoreAllMocks());

  it("still runs a bcrypt.compare when the email doesn't exist, instead of returning immediately", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const compareSpy = jest.spyOn(bcrypt, "compare");

    const res = await request(buildApp())
      .post("/login")
      .send({ email: "nobody@example.com", password: "whatever" });

    expect(res.status).toBe(401);
    expect(compareSpy).toHaveBeenCalledTimes(1);
    expect(compareSpy).toHaveBeenCalledWith("whatever", expect.any(String));
  });

  it("runs the same bcrypt.compare shape when the email exists but the password is wrong", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, email: "real@example.com", password: "$2b$10$fakehash" }] });
    const compareSpy = jest.spyOn(bcrypt, "compare").mockResolvedValueOnce(false);

    const res = await request(buildApp())
      .post("/login")
      .send({ email: "real@example.com", password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(compareSpy).toHaveBeenCalledTimes(1);
    expect(compareSpy).toHaveBeenCalledWith("wrong-password", "$2b$10$fakehash");
  });
});

describe("login - suspended company", () => {
  afterEach(() => jest.restoreAllMocks());

  it("rejects a correct password when the user's company is suspended", async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 1, email: "user@suspended.com", password: "$2b$10$fakehash", company_is_active: false }],
    });
    jest.spyOn(bcrypt, "compare").mockResolvedValueOnce(true);

    const res = await request(buildApp())
      .post("/login")
      .send({ email: "user@suspended.com", password: "correct-password" });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("COMPANY_SUSPENDED");
  });

  it("does not block a super_admin, whose company_is_active is always null", async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, email: "super@aqred.com", password: "$2b$10$fakehash", company_is_active: null, role: "super_admin" }] })
      .mockResolvedValueOnce({ rows: [] }); // 2FA prefs lookup
    jest.spyOn(bcrypt, "compare").mockResolvedValueOnce(true);

    const res = await request(buildApp())
      .post("/login")
      .send({ email: "super@aqred.com", password: "correct-password" });

    expect(res.status).not.toBe(403);
  });
});
