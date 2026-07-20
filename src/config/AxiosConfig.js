import axios from "axios";
import Swal from "sweetalert2";
import store from "@/store";
import { logout as logoutAction } from "@/store/slices/authSlice";

// Session check
export const isSessionExpired = (message) => {
  if (!message || typeof message !== "string") return false;

  const sessionExpiredMessages = [
    "Account has been expired",
    "Account has been blocked",
    "Account has blocked",
    "Invalid token",
    "No token provided",
    "Your account has been inactivated",
  ];

  return sessionExpiredMessages.some((msg) =>
    message.toLowerCase().includes(msg.toLowerCase())
  );
};

let isLoggingOut = false;

export const handleSessionExpiration = async (error) => {
  const errorMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "";

  if (!isSessionExpired(errorMessage)) {
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
    store.dispatch(logoutAction());

    await Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Session expired. Please login again!",
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonText: "OK",
      confirmButtonColor: "#465fff",
      zIndex: 99999,
      customClass: {
        confirmButton: "min-w-[100px] focus:outline-none focus:ring-0",
      },
    });

    window.location.href = loginPath;
  }

  isLoggingOut = false;
  return true;
};

// Axios JSON instance
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
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
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
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

// Mock auth requests for appointment booking panel
export const userLogin = async (data) => {
  // If baseline API matches
  try {
    return await axiosInstance.post("/api/v1/auth/login", data);
  } catch (err) {
    // If backend isn't running, return mock success for developer testing
    if (data.email === "admin@booking.com" && data.password === "admin123") {
      return {
        status: 200,
        data: {
          status: true,
          data: [
            {
              token: "mock-token-jwt-12345",
              admin: {
                id: 1,
                name: "Admin User",
                email: "admin@booking.com",
                type: "admin",
                is_active: 1,
              },
            },
          ],
        },
      };
    }
    throw err;
  }
};

export const userLogout = async () => {
  return axiosInstance.post("/api/v1/auth/logout");
};

export const getProfile = async () => {
  try {
    return await axiosInstance.get("/api/v1/auth/profile");
  } catch (err) {
    if (typeof window !== "undefined" && localStorage.getItem("AppointmentBooking_token")) {
      return {
        status: 200,
        data: {
          status: true,
          data: [
            {
              id: 1,
              name: "Admin User",
              email: "admin@booking.com",
              dob: "1990-01-01",
              joining_date: "2026-01-01",
              mobile_number: "9876543210",
              is_active: 1,
            },
          ],
        },
      };
    }
    throw err;
  }
};

export const getDashboardStats = async () => {
  // Return stats for Appointment Booking: Bookings, Revenue, Staff, Services
  return {
    status: 200,
    data: {
      status: true,
      data: [
        {
          totalBookings: { current: 154, percentage_increase: 12 },
          activeStaff: { current: 8, percentage_increase: 0 },
          activeServices: { current: 15, percentage_increase: 5 },
          totalRevenue: { current: 145000, percentage_increase: 18 },
        },
      ],
    },
  };
};

export const getBookings = async () => {
  return {
    status: 200,
    data: {
      status: true,
      data: [
        { id: "B-101", customerName: "Rahul Sharma", serviceName: "Haircut & Styling", date: "2026-07-21", time: "10:00 AM", status: "Confirmed", amount: 1500 },
        { id: "B-102", customerName: "Priya Patel", serviceName: "Spa Treatment", date: "2026-07-21", time: "11:30 AM", status: "Confirmed", amount: 3500 },
        { id: "B-103", customerName: "Amit Verma", serviceName: "Dental Checkup", date: "2026-07-22", time: "02:00 PM", status: "Pending", amount: 2000 },
        { id: "B-104", customerName: "Sneha Reddy", serviceName: "Nail Art", date: "2026-07-23", time: "04:30 PM", status: "Cancelled", amount: 1200 },
      ],
    },
  };
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

export default axiosInstance;
