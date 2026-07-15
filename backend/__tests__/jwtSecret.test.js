// Prevent dotenv from reloading backend/.env and clobbering our test env vars.
jest.mock("dotenv", () => ({ config: () => {} }));

describe("config/jwtSecret", () => {
  const ORIGINAL_SECRET = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = ORIGINAL_SECRET;
    jest.resetModules();
  });

  it("throws at load time when JWT_SECRET is not set", () => {
    jest.resetModules();
    delete process.env.JWT_SECRET;
    expect(() => require("../config/jwtSecret")).toThrow(/JWT_SECRET is not set/);
  });

  it("exports the secret when it is set", () => {
    jest.resetModules();
    process.env.JWT_SECRET = "some_secret";
    expect(require("../config/jwtSecret")).toBe("some_secret");
  });
});
