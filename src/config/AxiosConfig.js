import axios from "axios";
import Swal from "sweetalert2";
import store from "@/store";
import { logout as logoutAction } from "@/store/slices/authSlice";

// Session check
export const isSessionExpired = (error) => {
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    return true;
  }

  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "";
  if (!message || typeof message !== "string") return false;

  const sessionExpiredMessages = [
    "Account has been expired",
    "Account has been blocked",
    "Account has blocked",
    "Invalid token",
    "No token provided",
    "Your account has been inactivated",
    "Account is deactivated",
    "Unauthorized access",
    "Unauthorized",
    "jwt expired",
    "jwt malformed",
  ];

  return sessionExpiredMessages.some((msg) =>
    message.toLowerCase().includes(msg.toLowerCase())
  );
};

let isLoggingOut = false;

export const handleSessionExpiration = async (error) => {
  if (!isSessionExpired(error)) {
    return false;
  }

  if (isLoggingOut) {
    return true;
  }
  isLoggingOut = true;

  const loginPath = "/login";

  // Clear local storage and dispatch logout action
  if (typeof window !== "undefined") {
    localStorage.removeItem("AppointmentBooking_token");
    localStorage.removeItem("AppointmentBooking_admin");
    try {
      store.dispatch(logoutAction());
    } catch (e) {
      // ignore
    }

    if (window.location.pathname !== loginPath) {
      await Swal.fire({
        icon: "error",
        title: "Session Expired",
        text: "Your session has expired or account is inactive. Please log in again.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        confirmButtonText: "Log In",
        confirmButtonColor: "#465fff",
        zIndex: 99999,
        customClass: {
          confirmButton: "min-w-[100px] focus:outline-none focus:ring-0 font-medium py-2 px-4 rounded-lg",
        },
      });

      window.location.href = loginPath;
    }
  }

  return true;
};

// Axios JSON instance
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("AppointmentBooking_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const userTimeZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
      config.headers["user_time_zone"] = userTimeZone;

      const lang = localStorage.getItem("language") || "en";
      config.headers["language_status"] = lang;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    await handleSessionExpiration(error);
    return Promise.reject(error);
  }
);

// Axios FormData instance
const axiosInstanceFormData = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "multipart/form-data",
  },
});

axiosInstanceFormData.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("AppointmentBooking_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const userTimeZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
      config.headers["user_time_zone"] = userTimeZone;

      const lang = localStorage.getItem("language") || "en";
      config.headers["language_status"] = lang;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstanceFormData.interceptors.response.use(
  (response) => response,
  async (error) => {
    await handleSessionExpiration(error);
    return Promise.reject(error);
  }
);

export const updateProfile = async (data) => {
  return axiosInstanceFormData.post("/api/v1/auth/update-profile", data);
};

export const getAdminProfile = async () => {
  return axiosInstance.get("/api/v1/auth/profile");
};

// Real auth requests connected to backend
export const userLogin = async (data) => {
  return await axiosInstance.post("/api/admin/auth/login", data);
};

export const userLogout = async () => {
  return { status: 200 };
};

export const getProfile = async () => {
  return await axiosInstance.get("/api/admin/profile");
};

export const updateUserProfile = async (data) => {
  return await axiosInstance.put("/api/admin/profile", data);
};

export const updateUserPassword = async (data) => {
  return await axiosInstance.put("/api/admin/profile/change-password", data);
};

export const getDashboardStats = async (payload = { type: "Admin" }) => {
  return await axiosInstance.post("/api/admin/dashboard/stats", payload);
};

export const getBookings = async (params = {}) => {
  return await axiosInstance.get("/api/admin/bookings", { params });
};

export const updateAdminBookingRecord = async (id, data) => {
  return await axiosInstance.put(`/api/admin/bookings/${id}`, data);
};

export const deleteAdminBookingRecord = async (id) => {
  return await axiosInstance.delete(`/api/admin/bookings/${id}`);
};

export const getStaffList = async () => {
  return {
    status: 200,
    data: {
      status: true,
      data: [
        { id: 1, name: "Ananya Sen", role: "Senior Stylist", email: "ananya@booking.com", phone: "9876543211", status: "Active" },
        { id: 2, name: "Vikram Malhotra", role: "Therapist", email: "vikram@booking.com", phone: "9876543212", status: "Active" },
        { id: 3, name: "Dr. Rohan Joshi", role: "Dentist", email: "rohan@booking.com", phone: "9876543213", status: "Active" },
        { id: 4, name: "Meera Nair", role: "Receptionist", email: "meera@booking.com", phone: "9876543214", status: "Inactive" },
      ],
    },
  };
};

export const getServicesList = async () => {
  return {
    status: 200,
    data: {
      status: true,
      data: [
        { id: 1, name: "Haircut & Styling", duration: "45 mins", price: 1500, category: "Hair" },
        { id: 2, name: "Spa Treatment", duration: "90 mins", price: 3500, category: "Wellness" },
        { id: 3, name: "Dental Checkup", duration: "30 mins", price: 2000, category: "Medical" },
        { id: 4, name: "Facial Care", duration: "60 mins", price: 2500, category: "Beauty" },
      ],
    },
  };
};

export const getCustomersList = async () => {
  return {
    status: 200,
    data: {
      status: true,
      data: [
        { id: 1, name: "Rahul Sharma", email: "rahul@gmail.com", phone: "9898989801", bookingsCount: 5 },
        { id: 2, name: "Priya Patel", email: "priya@gmail.com", phone: "9898989802", bookingsCount: 12 },
        { id: 3, name: "Amit Verma", email: "amit@gmail.com", phone: "9898989803", bookingsCount: 2 },
        { id: 4, name: "Sneha Reddy", email: "sneha@gmail.com", phone: "9898989804", bookingsCount: 7 },
      ],
    },
  };
};

export const getAdminsList = async (params = {}) => {
  return await axiosInstance.get("/api/superadmin/admins", { params });
};

export const registerAdmin = async (data) => {
  return await axiosInstance.post("/api/superadmin/admins", data);
};

export const toggleAdminActive = async (id) => {
  return await axiosInstance.put(`/api/superadmin/admins/${id}/toggle`);
};

export const toggleAdminApiCredentials = async (id) => {
  return await axiosInstance.put(`/api/superadmin/admins/${id}/toggle-credentials`);
};

export const updateAdmin = async (id, data) => {
  return await axiosInstance.put(`/api/superadmin/admins/${id}`, data);
};

export const deleteAdmin = async (id) => {
  return await axiosInstance.delete(`/api/superadmin/admins/${id}`);
};

export const getAdminFormConfigSuper = async (adminId) => {
  return await axiosInstance.get(`/api/superadmin/form-config/${adminId}`);
};

export const updateAdminFormConfigSuper = async (adminId, data) => {
  return await axiosInstance.put(`/api/superadmin/form-config/${adminId}`, data);
};

export const getAdminFormConfig = async () => {
  return await axiosInstance.get("/api/admin/form-config");
};

export const updateAdminFormConfig = async (data) => {
  return await axiosInstance.put("/api/admin/form-config", data);
};

export const updateAdminSlotSettings = async (data) => {
  return await axiosInstance.put("/api/admin/slot-settings", data);
};

export const getAdminSlotSettingsSuper = async (adminId) => {
  return await axiosInstance.get(`/api/superadmin/slot-settings/${adminId}`);
};

export const getAdminSlotSettings = async () => {
  return await axiosInstance.get("/api/admin/slot-settings");
};

export const updateAdminSlotSettingsSuper = async (adminId, data) => {
  return await axiosInstance.put(`/api/superadmin/slot-settings/${adminId}`, data);
};

export const getHolidaysList = async () => {
  return await axiosInstance.get("/api/holidays");
};

export const createHolidayRecord = async (data) => {
  return await axiosInstance.post("/api/holidays", data);
};

export const updateHolidayRecord = async (id, data) => {
  return await axiosInstance.put(`/api/holidays/${id}`, data);
};

export const deleteHolidayRecord = async (id) => {
  return await axiosInstance.delete(`/api/holidays/${id}`);
};

export const getAdminHolidaysSuperList = async (adminId) => {
  return await axiosInstance.get(`/api/holidays/admin/${adminId}`);
};

export const createAdminHolidaySuperRecord = async (adminId, data) => {
  return await axiosInstance.post(`/api/holidays/admin/${adminId}`, data);
};

export const updateAdminHolidaySuperRecord = async (adminId, id, data) => {
  return await axiosInstance.put(`/api/holidays/admin/${adminId}/${id}`, data);
};

export const deleteAdminHolidaySuperRecord = async (adminId, id) => {
  return await axiosInstance.delete(`/api/holidays/admin/${adminId}/${id}`);
};

export const getAdminBookingsSuperList = async (adminId) => {
  return await axiosInstance.get(`/api/superadmin/bookings/${adminId}`);
};

export const updateAdminBookingSuperRecord = async (id, data) => {
  return await axiosInstance.put(`/api/superadmin/bookings/${id}`, data);
};

export const deleteAdminBookingSuperRecord = async (id) => {
  return await axiosInstance.delete(`/api/superadmin/bookings/${id}`);
};

export const getAvailableSlotsList = async (adminId, date) => {
  return await axiosInstance.get(`/api/bookings/available-slots/${adminId}?date=${date}`);
};

export const createBookingRecord = async (adminId, data) => {
  return await axiosInstance.post(`/api/bookings/${adminId}`, data);
};

// UserModule & Medicine API Endpoints
export const toggleUserModuleApi = async (data) => {
  return await axiosInstance.post(`/api/user-modules/toggle`, data);
};

export const getUserModulesApi = async (adminId) => {
  return await axiosInstance.get(`/api/user-modules/${adminId}`);
};

export const getMedicinesListApi = async (adminId) => {
  return await axiosInstance.get(`/api/medicines?adminId=${adminId}`);
};

export const createMedicineRecord = async (data) => {
  return await axiosInstance.post(`/api/medicines`, data);
};

export const updateMedicineRecord = async (id, data) => {
  return await axiosInstance.put(`/api/medicines/${id}`, data);
};

export const deleteMedicineRecord = async (id, adminId) => {
  return await axiosInstance.delete(`/api/medicines/${id}?adminId=${adminId}`);
};

// Sub-User / User Management API Endpoints
export const getSubUsersListApi = async (adminId) => {
  return await axiosInstance.get(`/api/user-management?adminId=${adminId}`);
};

export const createSubUserRecord = async (data) => {
  return await axiosInstance.post(`/api/user-management`, data);
};

export const updateSubUserRecord = async (id, data) => {
  return await axiosInstance.put(`/api/user-management/${id}`, data);
};

export const toggleSubUserActiveApi = async (id, adminId) => {
  return await axiosInstance.patch(`/api/user-management/${id}/toggle-active`, { adminId });
};

export const deleteSubUserRecord = async (id, adminId) => {
  return await axiosInstance.delete(`/api/user-management/${id}?adminId=${adminId}`);
};

// Prescription API Endpoints
export const getPrescriptionByBookingApi = async (bookingId) => {
  return await axiosInstance.get(`/api/prescriptions/${bookingId}`);
};

export const savePrescriptionApi = async (data) => {
  return await axiosInstance.post(`/api/prescriptions`, data);
};

export default axiosInstance;

