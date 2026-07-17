import { useEffect } from "react";

// Closes the caller (a modal/dropdown/etc.) on Escape while `active` is true.
const useEscapeKey = (active, onClose) => {
  useEffect(() => {
    if (!active) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [active, onClose]);
};

export default useEscapeKey;
