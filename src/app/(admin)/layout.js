"use client";

import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import Backdrop from "@/components/layout/Backdrop";
import AppHeader from "@/components/layout/AppHeader";
import { useSidebar } from "@/context/SidebarContext";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const adminState = useSelector((state) => state.admin) || {};
  const { isAuthenticated, loading, isRehydrated } = adminState;

  useEffect(() => {
    // Client-side authentication check after rehydration is complete
    if (isRehydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [isRehydrated, isAuthenticated, router]);

  if (!isRehydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Double check in rendering to prevent momentary flicker of dashboard if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen transition-all duration-300 ease-in-out md:flex bg-gray-50 overflow-x-hidden w-full">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 flex flex-col h-screen transition-all duration-300 ease-in-out w-full overflow-x-hidden ${isExpanded || isHovered
          ? `${isExpanded ? "md:ml-[290px]" : "md:ml-0"} lg:ml-[290px]`
          : "md:ml-0 lg:ml-[90px]"
          } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <div className="relative flex-1 overflow-y-auto overflow-x-hidden bg-gray-50">
          <div className="p-4 mx-auto max-w-breakpoint-2xl md:p-5 lg:p-6 xl:p-6 w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
