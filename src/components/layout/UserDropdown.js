"use client";

import { useState } from "react";
import { DropdownItem, Dropdown } from "@/components/UI/Dropdown";
import { useDispatch, useSelector } from "react-redux";
import { adminUpdateStates, logout } from "@/store/slices/authSlice";
import { userLogout as logoutAPI } from "@/config/AxiosConfig";
import { useRouter, usePathname } from "next/navigation";
import { Toast } from "@/components/Toast";
import Loader from "@/components/UI/Loader";
import { DeleteConfirmModal } from "@/components/UI/Modal";

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

      // Clear local storage and state first
      if (typeof window !== "undefined") {
        localStorage.removeItem("AppointmentBooking_admin");
        localStorage.removeItem("AppointmentBooking_token");
      }
      dispatch(logout());

      try {
        await logoutAPI();
      } catch (apiErr) {
        console.warn("Logout API failed, but state cleared:", apiErr);
      }

      Toast({
        message: "Logged out successfully",
        type: "success",
      });
    } catch (error) {
      console.error("Error in logout:", error);
    } finally {
      dispatch(adminUpdateStates({ loading: false }));
      setIsLogoutModalOpen(false);
      router.push("/login");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dropdown-toggle focus:outline-none"
      >
        <span className="mr-3 overflow-hidden rounded-full h-10 w-10">
          <img
            src="/user-avtar.png"
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        </span>

        <span className="block capitalize mr-1 font-medium text-theme-sm">
          {admin?.name || "Admin"}
        </span>
        <svg
          className={`stroke-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
            }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        zIndex={dropdownZIndex}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-lg border border-gray-200 bg-white p-3 shadow-theme-lg"
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
              <svg
                className="fill-gray-500 group-hover:fill-gray-700"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM17.0246 18.8566V18.8455C17.0246 16.7744 15.3457 15.0955 13.2746 15.0955H10.7246C8.65354 15.0955 6.97461 16.7744 6.97461 18.8455V18.856C8.38223 19.8895 10.1198 20.5 12 20.5C13.8798 20.5 15.6171 19.8898 17.0246 18.8566ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25ZM8.48126 9.26784C8.48126 7.32499 10.0563 5.75 11.9991 5.75C13.9419 5.75 15.5169 7.32499 15.5169 9.26784C15.5169 11.2107 13.9419 12.7857 11.9991 12.7857C10.0563 12.7857 8.48126 11.2107 8.48126 9.26784Z"
                  fill="currentColor"
                />
              </svg>
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
            <svg
              className="fill-gray-500 group-hover:fill-gray-700"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44865 7.61255 9.44848 7.13767 9.15548 6.84488C8.86249 6.55209 8.38761 6.55226 8.09482 6.84525L3.52309 11.4202C3.35674 11.5577 3.25073 11.7657 3.25073 11.9984ZM12.0009 8.16493C9.88289 8.16493 8.1659 9.88191 8.1659 11.9999C8.1659 14.1179 9.88289 15.8349 12.0009 15.8349C14.1189 15.8349 15.8359 14.1179 15.8359 11.9999C15.8359 9.88191 14.1189 8.16493 12.0009 8.16493Z"
                fill="currentColor"
              />
            </svg>
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
