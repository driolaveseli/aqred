const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const parseUser = require("../middleware/parseUser");

const SECRET = process.env.JWT_SECRET;

const app = express();
app.use(cookieParser());
app.use(parseUser);
app.get("/whoami", (req, res) => res.json({ user: req.user || null }));

describe("parseUser", () => {
  it("leaves req.user undefined when there is no cookie", async () => {
    const res = await request(app).get("/whoami");
    expect(res.body.user).toBeNull();
  });

  it("leaves req.user undefined for an invalid cookie instead of rejecting", async () => {
    const res = await request(app).get("/whoami").set("Cookie", ["token=garbage"]);
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it("attaches req.user for a valid cookie", async () => {
    const token = jwt.sign({ id: 9, role: "manager" }, SECRET, { expiresIn: "1h" });
    const res = await request(app).get("/whoami").set("Cookie", [`token=${token}`]);
    expect(res.body.user).toMatchObject({ id: 9, role: "manager" });
  });
});
