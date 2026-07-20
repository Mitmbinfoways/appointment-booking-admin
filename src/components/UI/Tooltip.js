"use client";

import React, { useState } from "react";

export default function Tooltip({ content, children }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative w-full h-full flex flex-col justify-between"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[9999] pointer-events-auto cursor-text transition-all duration-200 select-text"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
          {/* Transparent bridge to connect tooltip with the cell and prevent leaving hover state */}
          <div className="absolute top-full left-0 right-0 h-3 bg-transparent"></div>

          <div className="bg-gray-900/95 text-white text-[11px] font-medium py-1.5 px-2.5 rounded-lg shadow-xl border border-gray-700/50 whitespace-nowrap select-text">
            {content}
          </div>
          <div className="w-2.5 h-2.5 bg-gray-900 border-r border-b border-gray-700/50 rotate-45 absolute -bottom-1.25 left-1/2 -translate-x-1/2 pointer-events-none"></div>
        </div>
      )}
    </div>
  );
}
