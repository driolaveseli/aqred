jest.mock("../config/db", () => ({ query: jest.fn() }));

const db = require("../config/db");
const { submitContact } = require("../controllers/contactController");

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const VALID_BODY = {
  firstName: "Jane", lastName: "Doe", email: "jane@example.com",
  company: "Acme", message: "Interested in a demo.",
};

describe("contactController.submitContact", () => {
  afterEach(() => jest.clearAllMocks());

  it("rejects a submission missing a required field", async () => {
    const res = buildRes();
    await submitContact({ body: { ...VALID_BODY, message: "" } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(db.query).not.toHaveBeenCalled();
  });

  it("rejects an invalid email address", async () => {
    const res = buildRes();
    await submitContact({ body: { ...VALID_BODY, email: "not-an-email" } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(db.query).not.toHaveBeenCalled();
  });

  it("rejects a field that exceeds the max length", async () => {
    const res = buildRes();
    await submitContact({ body: { ...VALID_BODY, message: "x".repeat(5001) } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(db.query).not.toHaveBeenCalled();
  });

  it("stores a valid submission and confirms receipt", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, ...VALID_BODY }] });
    const res = buildRes();

    await submitContact({ body: VALID_BODY }, res);

    expect(db.query).toHaveBeenCalledTimes(1);
    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO contact_messages/);
    expect(params).toEqual(["Jane", "Doe", "jane@example.com", "Acme", "Interested in a demo."]);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("treats company as optional", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 2 }] });
    const res = buildRes();
    const { company, ...withoutCompany } = VALID_BODY;

    await submitContact({ body: withoutCompany }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const [, params] = db.query.mock.calls[0];
    expect(params[3]).toBeNull();
  });
});
