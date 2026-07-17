import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import Login from "./Login";

jest.mock("../services/api", () => ({
  get: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} }),
}));

// Regression test: RightShell used to be defined inside the Login component
// body, so it got a new identity on every render. Since the email/password
// inputs render as its children, every keystroke tore down and rebuilt that
// whole subtree, dropping focus off the input after a single character.
test("email and password fields keep focus while typing", async () => {
  render(<MemoryRouter><AuthProvider><Login /></AuthProvider></MemoryRouter>);

  const email = screen.getByPlaceholderText("you@company.com");
  await userEvent.type(email, "person@example.com");
  expect(email).toHaveValue("person@example.com");
  expect(document.activeElement).toBe(email);

  const password = screen.getByPlaceholderText("••••••••");
  await userEvent.click(password);
  await userEvent.type(password, "hunter2pass");
  expect(password).toHaveValue("hunter2pass");
  expect(document.activeElement).toBe(password);
});
