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
  isAuthenticated: false,
  token: null,
  admin: null,
  loading: false,
  error: null,
  isModalOpen: false,
  isRehydrated: false,
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
      state.isAuthenticated = false;
      state.token = null;
      state.admin = null;
      state.loading = false;
      state.isRehydrated = true;
      if (typeof window !== "undefined") {
        localStorage.removeItem("AppointmentBooking_admin");
        localStorage.removeItem("AppointmentBooking_token");
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
