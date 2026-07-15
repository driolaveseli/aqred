import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("./services/api", () => ({
  get: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} }),
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

test("renders the landing page for an unauthenticated visitor", () => {
  render(<App />);
  expect(screen.getByText(/get started free/i)).toBeInTheDocument();
});
