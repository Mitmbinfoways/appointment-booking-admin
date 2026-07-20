"use client";

import React from "react";

// Table Component (<table>)
export const Table = ({ children, className = "", ...props }) => {
  return (
    <table className={`min-w-full divide-y divide-gray-200 transition-colors ${className}`} {...props}>
      {children}
    </table>
  );
};

// THead Component (<thead>)
export const THead = ({ children, className = "", ...props }) => {
  return (
    <thead className={`bg-gray-50 ${className}`} {...props}>
      {children}
    </thead>
  );
};

// TBody Component (<tbody>)
export const TBody = ({ children, className = "", ...props }) => {
  return (
    <tbody className={`bg-white divide-y divide-gray-200 ${className}`} {...props}>
      {children}
    </tbody>
  );
};

// TR Component (<tr>)
export const TR = ({ children, className = "", onClick, ...props }) => {
  return (
    <tr
      className={`hover:bg-gray-50/75 transition-colors ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </tr>
  );
};

// TD Component (<td>)
export const TD = ({ children, className = "", colSpan, ...props }) => {
  return (
    <td
      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${className}`}
      colSpan={colSpan}
      {...props}
    >
      {children}
    </td>
  );
};

// TH Component (<th>)
export const TH = ({ children, className = "", ...props }) => {
  return (
    <th
      className={`px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </th>
  );
};
