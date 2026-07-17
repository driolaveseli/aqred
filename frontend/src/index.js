import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import "./styles/tailwind.css";

// Apply persisted theme before first render to avoid flash
try {
  const saved = localStorage.getItem("mis_theme");
  if (saved) {
    const lower = saved.toLowerCase();
    const isDark = lower === "dark"
      || (lower === "auto" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    if (isDark) document.documentElement.classList.add("dark");
  }
} catch { /* ignore */ }
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
