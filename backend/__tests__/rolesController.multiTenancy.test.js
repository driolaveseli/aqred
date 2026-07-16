jest.mock("../config/db", () => ({ query: jest.fn() }));

const db = require("../config/db");
const rolesController = require("../controllers/rolesController");

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("rolesController - company scoping (regression test for the cross-tenant bug)", () => {
  afterEach(() => jest.clearAllMocks());

  it("getPermissions only reads role_permissions for the caller's own company", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const req = { user: { company_id: 42 } };

    await rolesController.getPermissions(req, buildRes());

    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toMatch(/WHERE company_id = \$1/);
    expect(params).toEqual([42]);
  });

  it("createRole scopes the new row to the caller's company", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const req = { user: { company_id: 42 }, body: { role: "auditor", permissions: ["reports"] } };

    await rolesController.createRole(req, buildRes());

    const [, params] = db.query.mock.calls[0];
    expect(params).toContain(42);
  });

  it("updatePermissions cannot touch another company's row with the same role name", async () => {
    db.query.mockResolvedValueOnce({ rows: [] }); // no row matches this company_id -> 404, not another company's row
    const req = { user: { company_id: 42 }, params: { role: "manager" }, body: { permissions: ["dashboard"] } };
    const res = buildRes();

    await rolesController.updatePermissions(req, res);

    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toMatch(/AND company_id = \$3/);
    expect(params).toEqual([JSON.stringify(["dashboard"]), "manager", 42]);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("deleteRole cannot touch another company's row with the same role name", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const req = { user: { company_id: 42 }, params: { role: "auditor" } };
    const res = buildRes();

    await rolesController.deleteRole(req, res);

    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toMatch(/AND company_id = \$2/);
    expect(params).toEqual(["auditor", 42]);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
