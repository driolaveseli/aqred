jest.mock("../config/db", () => ({ query: jest.fn() }));

const db = require("../config/db");
const productController = require("../controllers/productController");

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("productController - company scoping", () => {
  afterEach(() => jest.clearAllMocks());

  it("getProducts scopes the rows, count, stats, and categories queries to the caller's company", async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, name: "Widget" }] })
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({ rows: [{ total: 1, total_value: 10, low_stock_count: 0, out_of_stock_count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ category: "Tools" }] });

    const req = { user: { company_id: 42 }, query: {} };
    await productController.getProducts(req, buildRes());

    expect(db.query).toHaveBeenCalledTimes(4);
    for (const [, params] of db.query.mock.calls) {
      expect(params).toContain(42);
    }
  });

  it("getProductById scopes the lookup to the caller's company and 404s if not found", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const req = { params: { id: 5 }, user: { company_id: 42 } };
    const res = buildRes();

    await productController.getProductById(req, res);

    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toMatch(/WHERE id = \$1 AND company_id = \$2/);
    expect(params).toEqual([5, 42]);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("createProduct scopes the new row to the caller's company", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: "Widget" }] });
    const req = {
      user: { company_id: 42 },
      body: { name: "Widget", description: "", price: 10, stock: 5, sku: "W1", category: "Tools", reorder_point: 2 },
    };
    const res = buildRes();

    await productController.createProduct(req, res);

    const [, params] = db.query.mock.calls[0];
    expect(params).toContain(42);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("updateProduct cannot touch another company's product", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const req = { params: { id: 99 }, user: { company_id: 42 }, body: { name: "X", price: 1, stock: 1 } };
    const res = buildRes();

    await productController.updateProduct(req, res);

    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toMatch(/WHERE id=\$8 AND company_id=\$9/);
    expect(params).toContain(42);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("deleteProduct cannot touch another company's product", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const req = { params: { id: 99 }, user: { company_id: 42 } };
    const res = buildRes();

    await productController.deleteProduct(req, res);

    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toMatch(/WHERE id=\$1 AND company_id=\$2/);
    expect(params).toEqual([99, 42]);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
