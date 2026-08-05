import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, X } from "lucide-react";

export default function MultiSelectDropdown({
  options = [],
  value = [],
  onChange,
  placeholder = "Select options",
  disabled = false,
  hasError = false,
  id,
  dataFieldKey,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedArray = Array.isArray(value)
    ? value
    : typeof value === "string" && value
      ? value.split(",").map((s) => s.trim())
      : [];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleOption = (optVal) => {
    if (disabled) return;
    let updated;
    if (selectedArray.includes(optVal)) {
      updated = selectedArray.filter((item) => item !== optVal);
    } else {
      updated = [...selectedArray, optVal];
    }
    onChange(updated);
  };

  const handleRemoveBadge = (e, optVal) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selectedArray.filter((item) => item !== optVal));
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div
        id={id}
        data-field-key={dataFieldKey}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full min-h-[42px] px-3.5 py-2 bg-white border rounded-xl flex items-center justify-between transition-all select-none text-sm ${
          disabled
            ? "!bg-gray-100 !border-gray-200 cursor-not-allowed text-gray-500"
            : "cursor-pointer hover:bg-gray-50/50 focus:ring-2 focus:ring-blue-500/10"
        } ${
          hasError
            ? "border-red-500"
            : isOpen
              ? "border-blue-500 ring-2 ring-blue-500/10"
              : "border-gray-300"
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5 overflow-hidden pr-2">
          {selectedArray.length === 0 ? (
            <span className="text-gray-400 text-xs font-normal">
              {placeholder}
            </span>
          ) : selectedArray.length > 3 ? (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-2.5 py-1 text-xs font-semibold">
              {selectedArray.length} Selected
            </span>
          ) : (
            selectedArray.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-2 py-0.5 text-xs font-medium"
              >
                <span>{item}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveBadge(e, item)}
                    className="hover:bg-blue-100 rounded text-blue-500 p-0.5 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-blue-500" : ""
          }`}
        />
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-300 rounded-xl shadow-lg z-50 max-h-52 overflow-y-auto p-1.5 space-y-0.5">
          {options.length === 0 ? (
            <div className="p-2 text-xs text-gray-400 text-center italic">
              No options available
            </div>
          ) : (
            options.map((opt, optIdx) => {
              const optVal =
                typeof opt === "object" && opt !== null
                  ? opt.value || opt.label
                  : opt;
              const optLabel =
                typeof opt === "object" && opt !== null
                  ? opt.label || opt.value
                  : opt;
              const isSelected = selectedArray.includes(optVal);

              return (
                <div
                  key={optIdx}
                  onClick={() => handleToggleOption(optVal)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                    />
                    <span>{optLabel}</span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
