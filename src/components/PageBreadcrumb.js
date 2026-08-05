import React from "react";
import Link from "next/link";
import { MdKeyboardArrowRight } from "react-icons/md";

const PageBreadcrumb = ({ items = [] }) => {
  if (!items.length) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h2 className="text-xl font-semibold text-gray-800">
        {items[items.length - 1].label}
      </h2>
      <nav>
        <ol className="flex flex-wrap items-center gap-1.5 list-none p-0 m-0">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-center gap-1.5 list-none">
              {item.to && idx !== items.length - 1 ? (
                <Link
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-500"
                  href={item.to}
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-sm text-gray-800">{item.label}</span>
              )}
              {idx < items.length - 1 && (
                <MdKeyboardArrowRight className="text-gray-500" />
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
};

export default PageBreadcrumb;
