import React from "react";
import { FaChevronDown } from "react-icons/fa";

export default function Dropdown({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  error,
  icon: Icon,
  className = "",
  ...props
}) {
  return (
    <div className={`flex flex-col w-full ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">
          {label}
        </label>
      )}
      <div className="relative w-full">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
            <Icon className="text-sm" />
          </div>
        )}
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className={`appearance-none w-full bg-slate-50 dark:bg-slate-950/50 border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors duration-200 cursor-pointer
            ${Icon ? "pl-10" : ""}
            ${value ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}
            ${
              error
                ? "border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50"
                : "border-slate-300 dark:border-slate-800/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
            }`}
          {...props}
        >
          <option value="" disabled className="text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900">
            {placeholder}
          </option>
          {options.map((opt, i) => (
            <option key={i} value={opt.value} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <FaChevronDown className="text-[10px]" />
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs font-semibold text-rose-500/90">{error}</p>}
    </div>
  );
}
