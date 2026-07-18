jest.mock("../config/db", () => ({ query: jest.fn() }));

const db = require("../config/db");
const customerController = require("../controllers/customerController");

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("customerController - company scoping", () => {
  afterEach(() => jest.clearAllMocks());

  it("getCustomers scopes the rows, count, and stats queries to the caller's company", async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, name: "Acme" }] })
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({ rows: [{ total: 1, active_count: 1, inactive_count: 0, pending_count: 0 }] });

    const req = { user: { company_id: 42 }, query: {} };
    await customerController.getCustomers(req, buildRes());

    expect(db.query).toHaveBeenCalledTimes(3);
    for (const [, params] of db.query.mock.calls) {
      expect(params).toContain(42);
    }
  });

  it("getCustomerById scopes the lookup to the caller's company and 404s if not found", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const req = { params: { id: 5 }, user: { company_id: 42 } };
    const res = buildRes();

    await customerController.getCustomerById(req, res);

    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toMatch(/WHERE id = \$1 AND company_id = \$2/);
    expect(params).toEqual([5, 42]);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("createCustomer scopes the new row to the caller's company", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: "Acme" }] });
    const req = {
      user: { company_id: 42 },
      body: { name: "Acme", email: "a@acme.com", phone: "", address: "", company: "Acme Inc", status: "Active" },
    };
    const res = buildRes();

    await customerController.createCustomer(req, res);

    const [, params] = db.query.mock.calls[0];
    expect(params).toContain(42);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("updateCustomer cannot touch another company's customer", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const req = { params: { id: 99 }, user: { company_id: 42 }, body: { name: "X" } };
    const res = buildRes();

    await customerController.updateCustomer(req, res);

    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toMatch(/WHERE id=\$7 AND company_id=\$8/);
    expect(params).toContain(42);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("deleteCustomer cannot touch another company's customer", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const req = { params: { id: 99 }, user: { company_id: 42 } };
    const res = buildRes();

    await customerController.deleteCustomer(req, res);

    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toMatch(/WHERE id=\$1 AND company_id=\$2/);
    expect(params).toEqual([99, 42]);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
