"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSidebar } from "@/context/SidebarContext";
import UserDropdown from "@/components/layout/UserDropdown";

const AppHeader = () => {
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);

  const handleToggle = () => {
    if (window.innerWidth >= 768) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 flex w-full transition-all duration-300 ease-in-out bg-white border-gray-200 md:border-b shadow-sm">
      <div className="flex flex-col items-center justify-between grow md:flex-row md:px-5 lg:px-6">
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b transition-all duration-300 ease-in-out border-gray-200 sm:gap-4 md:justify-normal md:border-b-0 md:px-0 md:py-4">
          <button
            className="items-center justify-center w-10 h-10 transition-all duration-300 ease-in-out text-gray-500 border-gray-200 rounded-lg z-50 md:flex md:h-11 md:w-11 md:border focus:outline-none"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            <svg
              width="16"
              height="12"
              viewBox="0 0 16 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                fill="currentColor"
              />
            </svg>
          </button>

          <Link href="/" className="md:hidden flex items-center gap-2">
            <span className="h-10 w-10 aspect-square overflow-hidden rounded-full">
              <img
                className="w-full h-full object-cover"
                src="/user-avtar.png"
                alt="User Avatar"
              />
            </span>
            <span className="font-bold text-xl flex items-center text-gray-800">
              Booking Admin
            </span>
          </Link>

          <button
            onClick={toggleApplicationMenu}
            className="flex items-center justify-center w-10 h-10 transition-all duration-300 ease-in-out text-gray-700 rounded-lg z-50 hover:bg-gray-100 md:hidden focus:outline-none"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } items-center justify-between w-full gap-4 px-5 py-4 md:flex shadow-theme-md md:justify-end md:px-0 md:shadow-none bg-white md:bg-transparent`}
        >
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
