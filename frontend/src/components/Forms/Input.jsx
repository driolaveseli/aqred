import React from "react";

const Input = ({ label, error, ...props }) => (
  <div className="space-y-1">
    {label && (
      <label className="text-xs font-bold text-slate-500 uppercase">
        {label}
      </label>
    )}
    <input
      className={`form-input ${error ? "border-red-500" : "border-slate-200"}`}
      {...props}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

export default Input;
