import React, { useState, useRef, useEffect, useMemo } from "react";
import { FaChevronDown, FaSearch, FaTimes } from "react-icons/fa";

export default function SearchableDropdown({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  error,
  icon: Icon,
  className = "",
  multi = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef(null);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery(""); // clear search on close
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const lowerQuery = searchQuery.toLowerCase();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(lowerQuery)
    );
  }, [options, searchQuery]);

  // Determine selected labels for display
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
  
  const selectedOptions = useMemo(() => {
    return options.filter((opt) => selectedValues.includes(opt.value));
  }, [options, selectedValues]);

  const handleSelect = (optValue) => {
    if (multi) {
      const isSelected = selectedValues.includes(optValue);
      let newValues;
      if (isSelected) {
        newValues = selectedValues.filter((v) => v !== optValue);
      } else {
        newValues = [...selectedValues, optValue];
      }
      onChange(newValues);
    } else {
      onChange(optValue);
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  const handleRemoveChip = (e, optValue) => {
    e.stopPropagation(); // prevent opening dropdown
    const newValues = selectedValues.filter((v) => v !== optValue);
    onChange(newValues);
  };

  return (
    <div className={`flex flex-col w-full relative ${className}`} ref={dropdownRef}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 transition-colors"
        >
          {label}
        </label>
      )}

      {/* Trigger Button / Input Area */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${name}-options`}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          } else if (e.key === "Escape") {
            setIsOpen(false);
          }
        }}
        className={`relative w-full flex items-center min-h-[44px] bg-slate-50 dark:bg-slate-950/50 border rounded-xl px-3 py-1.5 cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
          ${
            error
              ? "border-rose-500/80 ring-1 ring-rose-500/50"
              : isOpen
              ? "border-blue-500 ring-1 ring-blue-500/50"
              : "border-slate-300 dark:border-slate-800/80 hover:border-slate-400 dark:hover:border-slate-700"
          }
        `}
      >
        {Icon && (
          <div className="text-slate-400 mr-2 flex-shrink-0">
            <Icon className="text-sm" />
          </div>
        )}

        <div className="flex-1 flex flex-wrap gap-1.5 items-center overflow-hidden pr-6">
          {multi ? (
            selectedOptions.length > 0 ? (
              selectedOptions.map((opt) => (
                <span
                  key={opt.value}
                  className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-semibold px-2 py-1 rounded-md transition-colors"
                >
                  {opt.label}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveChip(e, opt.value)}
                    className="hover:text-rose-500 dark:hover:text-rose-400 focus:outline-none transition-colors"
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-400 dark:text-slate-500">
                {placeholder}
              </span>
            )
          ) : (
            <span
              className={`text-sm ${
                selectedOptions.length > 0
                  ? "text-slate-900 dark:text-slate-100"
                  : "text-slate-400 dark:text-slate-500"
              } truncate`}
            >
              {selectedOptions.length > 0 ? selectedOptions[0].label : placeholder}
            </span>
          )}
        </div>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex-shrink-0">
          <FaChevronDown
            className={`text-[10px] transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-xs font-semibold text-rose-500/90" role="alert">{error}</p>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] z-50 overflow-hidden flex flex-col max-h-60 transition-colors duration-200">
          
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/30 shrink-0">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setFocusedIndex(-1); // Reset focus when search changes
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsOpen(false);
                    setSearchQuery("");
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setFocusedIndex((prev) => 
                      prev < filteredOptions.length - 1 ? prev + 1 : prev
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                  } else if (e.key === "Enter" && focusedIndex >= 0) {
                    e.preventDefault();
                    handleSelect(filteredOptions[focusedIndex].value);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {filteredOptions.length > 0 ? (
              <ul id={`${name}-options`} role="listbox" className="py-1">
                {filteredOptions.map((opt, index) => {
                  const isSelected = selectedValues.includes(opt.value);
                  const isFocused = index === focusedIndex;
                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(opt.value);
                      }}
                      className={`px-4 py-2 text-sm cursor-pointer transition-colors duration-150 flex items-center justify-between
                        ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }
                        ${isFocused ? "ring-2 ring-blue-500 bg-slate-100 dark:bg-slate-800" : ""}
                      `}
                    >
                      <span>{opt.label}</span>
                      {multi && isSelected && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-4 py-3 text-sm text-slate-500 text-center">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
