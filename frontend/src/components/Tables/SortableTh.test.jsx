import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SortableTh from "./SortableTh";

// Mimics how a real page uses SortableTh: some unrelated bit of parent state
// changes (e.g. typing in a search box) and re-renders the page. Because
// SortableTh is imported rather than defined inline, its identity never
// changes, so its <th> should reconcile instead of remounting.
const GoodHarness = () => {
  const [count, setCount] = useState(0);
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>rerender {count}</button>
      <table>
        <thead>
          <tr>
            <SortableTh field="name" sortField={sortField} sortDir={sortDir} onSort={(f) => { setSortField(f); setSortDir("asc"); }}>
              Name
            </SortableTh>
          </tr>
        </thead>
      </table>
    </div>
  );
};

// Reproduces the bug we fixed elsewhere: a table-header component defined
// INSIDE the parent's render body gets a new identity every render, so React
// unmounts and remounts it instead of reconciling.
const BadHarness = () => {
  const [count, setCount] = useState(0);

  const InlineTh = ({ children }) => <th>{children}</th>;

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>rerender {count}</button>
      <table>
        <thead>
          <tr><InlineTh>Name</InlineTh></tr>
        </thead>
      </table>
    </div>
  );
};

test("SortableTh's <th> survives an unrelated parent re-render (the fixed behavior)", () => {
  const { container } = render(<GoodHarness />);
  const thBefore = container.querySelector("th");
  fireEvent.click(screen.getByText(/rerender/));
  const thAfter = container.querySelector("th");
  expect(thAfter).toBe(thBefore);
});

test("a header component defined inside its parent's render body remounts on every render (the bug we fixed)", () => {
  const { container } = render(<BadHarness />);
  const thBefore = container.querySelector("th");
  fireEvent.click(screen.getByText(/rerender/));
  const thAfter = container.querySelector("th");
  expect(thAfter).not.toBe(thBefore);
});
