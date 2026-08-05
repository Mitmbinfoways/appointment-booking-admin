"use client";

import { useState } from "react";
import Image from "next/image";
import { DropdownItem, Dropdown } from "@/components/UI/Dropdown";
import { useDispatch, useSelector } from "react-redux";
import { adminUpdateStates, logout } from "@/store/slices/authSlice";
import { userLogout as logoutAPI } from "@/config/AxiosConfig";
import { useRouter, usePathname } from "next/navigation";
import { Toast } from "@/components/Toast";
import Loader from "@/components/UI/Loader";
import { DeleteConfirmModal } from "@/components/UI/Modal";
import { LogOut, User, ChevronDown } from "lucide-react";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const adminState = useSelector((state) => state.admin) || {};
  const { admin, loading } = adminState;

  const dropdownZIndex = pathname === "/settings" ? 9999 : 40;

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
    closeDropdown();
  };

  const handleLogoutConfirm = async () => {
    try {
      dispatch(adminUpdateStates({ loading: true }));

      try {
        await logoutAPI();
      } catch (apiErr) {
        console.warn(
          "Logout API failed, but continuing clearing state:",
          apiErr,
        );
      }

      // Clear local storage
      if (typeof window !== "undefined") {
        localStorage.removeItem("AppointmentBooking_admin");
        localStorage.removeItem("AppointmentBooking_token");
      }

      Toast({
        message: "Logged out successfully",
        type: "success",
      });

      // Dispatch logout state changes last
      dispatch(logout());
      router.push("/login");
    } catch (error) {
      console.error("Error in logout:", error);
    } finally {
      dispatch(adminUpdateStates({ loading: false }));
      setIsLogoutModalOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dropdown-toggle focus:outline-none"
      >
        <span className="mr-3 overflow-hidden rounded-full h-10 w-10 relative">
          <Image
            src="/user-avtar.png"
            alt="User Avatar"
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        </span>

        <span className="block capitalize mr-1 font-medium text-theme-sm">
          {admin?.username || admin?.name || "Admin"}
        </span>
        <ChevronDown
          className={`w-4.5 h-4.5 text-gray-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        zIndex={dropdownZIndex}
        className="absolute left-0 md:left-auto right-auto md:right-0 mt-[17px] flex w-[260px] flex-col rounded-lg border border-gray-200 bg-white p-3 shadow-theme-lg"
      >
        <div>
          <span className="block capitalize font-semibold text-gray-800 text-theme-sm">
            {admin?.username || "User"}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500">
            {admin?.email || ""}
          </span>
          <span className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
            {admin?.role || "Admin"}
          </span>
        </div>

        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700"
            >
              <User className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
              Profile
            </DropdownItem>
          </li>
        </ul>
        {loading ? (
          <span className="flex items-center gap-3 px-3 py-2 mt-3 cursor-pointer font-medium text-gray-700 rounded-lg group text-theme-sm">
            <Loader size="sm" speed="fast" />
            Logging out...
          </span>
        ) : (
          <span
            onClick={handleLogoutClick}
            className="flex items-center gap-3 px-3 py-2 mt-3 cursor-pointer font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700"
          >
            <LogOut className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
            Logout
          </span>
        )}
      </Dropdown>

      <DeleteConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to login again to access the system."
        itemName=""
        loading={loading}
        confirmButtonText="Logout"
        loadingButtonText="Logging out..."
      />
    </div>
  );
}
