"use client";

import React, { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import store from "@/store";
import { loginSuccess, completeRehydration } from "@/store/slices/authSlice";
import { ThemeProvider } from "@/context/ThemeContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { ToastContainer, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// AuthRehydrator will run client-side on mount to load token and user details from localStorage
function AuthRehydrator({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const token = localStorage.getItem("AppointmentBooking_token");
        const adminStr = localStorage.getItem("AppointmentBooking_admin");
        if (token && adminStr) {
          const admin = JSON.parse(adminStr);
          dispatch(loginSuccess({ token, admin }));
        } else {
          dispatch(completeRehydration());
        }
      } catch (error) {
        console.error("Error rehydrating auth state:", error);
        dispatch(completeRehydration());
      }
    }
  }, [dispatch]);

  return children;
}

export default function GlobalProviders({ children }) {
  return (
    <Provider store={store}>
      <AuthRehydrator>
        <ThemeProvider>
          <SidebarProvider>
            {children}
            <ToastContainer position="top-center" transition={Bounce} />
          </SidebarProvider>
        </ThemeProvider>
      </AuthRehydrator>
    </Provider>
  );
}
