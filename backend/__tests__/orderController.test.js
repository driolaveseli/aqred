jest.mock("../config/db", () => ({ query: jest.fn(), connect: jest.fn() }));

const db = require("../config/db");
const orderController = require("../controllers/orderController");

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const buildClient = (impl) => ({
  query: jest.fn(impl || (() => Promise.resolve({ rows: [] }))),
  release: jest.fn(),
});

describe("orderController - company scoping", () => {
  afterEach(() => jest.clearAllMocks());

  it("getOrderById scopes the lookup to the caller's company and 404s if not found", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const req = { params: { id: 7 }, user: { company_id: 42 } };
    const res = buildRes();

    await orderController.getOrderById(req, res);

    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toMatch(/WHERE o\.id = \$1 AND o\.company_id = \$2/);
    expect(params).toEqual([7, 42]);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("createOrder scopes the new order to the caller's company, normalizes status, and computes the total from items", async () => {
    const client = buildClient((sql) =>
      sql.includes("INSERT INTO orders")
        ? Promise.resolve({ rows: [{ id: 1, total: 20 }] })
        : Promise.resolve({ rows: [] })
    );
    db.connect.mockResolvedValue(client);

    const req = {
      user: { company_id: 42 },
      body: { customer_id: 3, status: "pending", items: [{ product_id: 9, quantity: 2, unit_price: 10 }] },
    };
    const res = buildRes();

    await orderController.createOrder(req, res);

    const [, insertParams] = client.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO orders"));
    expect(insertParams[1]).toBe("Pending"); // normalized from "pending"
    expect(insertParams[2]).toBe(20);        // 2 * 10, computed from items
    expect(insertParams[5]).toBe(42);        // company_id
    expect(client.query).toHaveBeenCalledWith("COMMIT");
    expect(client.release).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("updateOrder cannot touch another company's order", async () => {
    const client = buildClient();
    db.connect.mockResolvedValue(client);

    const req = { params: { id: 99 }, user: { company_id: 42 }, body: { status: "Shipped" } };
    const res = buildRes();

    await orderController.updateOrder(req, res);

    const lookupCall = client.query.mock.calls.find(([sql]) => sql.includes("SELECT * FROM orders"));
    expect(lookupCall[1]).toEqual([99, 42]);
    expect(client.query).toHaveBeenCalledWith("ROLLBACK");
    expect(client.release).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("deleteOrder cannot touch another company's order", async () => {
    const client = buildClient();
    db.connect.mockResolvedValue(client);

    const req = { params: { id: 99 }, user: { company_id: 42 } };
    const res = buildRes();

    await orderController.deleteOrder(req, res);

    const lookupCall = client.query.mock.calls.find(([sql]) => sql.includes("SELECT id FROM orders"));
    expect(lookupCall[1]).toEqual([99, 42]);
    expect(client.query).toHaveBeenCalledWith("ROLLBACK");
    expect(client.release).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
