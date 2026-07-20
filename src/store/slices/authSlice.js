import { createSlice } from "@reduxjs/toolkit";

const mockAdmin = {
  id: 1,
  name: "Admin User",
  email: "admin@booking.com",
  mobile_number: "9876543210",
  type: "admin",
  is_active: 1,
  dob: "1995-05-15",
  joining_date: "2026-01-10",
};

const initialState = {
  isAuthenticated: true, // Always authenticated to bypass login screen
  token: "mock-jwt-token-key-12345",
  admin: mockAdmin,
  loading: false,
  error: null,
  isModalOpen: false,
  isRehydrated: true, // Mark as rehydrated immediately
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
    },
    loginSuccess(state, action) {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.admin = action.payload.admin;
      state.loading = false;
      state.isRehydrated = true;
      if (typeof window !== "undefined") {
        localStorage.setItem("AppointmentBooking_admin", JSON.stringify(action.payload.admin));
        localStorage.setItem("AppointmentBooking_token", action.payload.token);
      }
    },
    loginFailure(state) {
      state.loading = false;
      state.isRehydrated = true;
    },
    logout(state) {
      // Clear but keep auth state active to skip login if desired, or allow actual logout.
      // Since the user wants to skip login, let's keep them authenticated or reset to mock.
      state.isAuthenticated = true;
      state.token = "mock-jwt-token-key-12345";
      state.admin = mockAdmin;
      state.loading = false;
      state.isRehydrated = true;
      if (typeof window !== "undefined") {
        localStorage.setItem("AppointmentBooking_admin", JSON.stringify(mockAdmin));
        localStorage.setItem("AppointmentBooking_token", "mock-jwt-token-key-12345");
      }
    },
    setAdmin(state, action) {
      state.admin = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("AppointmentBooking_admin", JSON.stringify(action.payload));
      }
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    adminUpdateStates(state, action) {
      Object.keys(action.payload).forEach((key) => {
        state[key] = action.payload[key];
      });
    },
    setIsModalOpen(state, action) {
      state.isModalOpen = action.payload;
    },
    closeModal(state) {
      state.isModalOpen = false;
    },
    completeRehydration(state) {
      state.isRehydrated = true;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setAdmin,
  setLoading,
  adminUpdateStates,
  setIsModalOpen,
  closeModal,
  completeRehydration,
} = adminSlice.actions;

export default adminSlice.reducer;
