"use client";

import React, { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, CheckCircle2, Phone, Info, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  adminUpdateStates,
  loginFailure,
  loginStart,
  loginSuccess,
} from "@/store/slices/authSlice";
import { Toast } from "@/components/Toast";
import Loader from "@/components/UI/Loader";
import { userLogin } from "@/config/AxiosConfig";

export default function LoginPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const adminState = useSelector((state) => state.admin) || {};
  const { loading, isAuthenticated, isRehydrated } = adminState;

  // If already authenticated, redirect to home
  useEffect(() => {
    if (isRehydrated && isAuthenticated) {
      router.push("/");
    }
  }, [isRehydrated, isAuthenticated, router]);

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const identifierRef = useRef(null);
  const passwordRef = useRef(null);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateMobile = (mobile) => {
    const re = /^[0-9]{10}$/;
    return re.test(mobile);
  };

  const getIdentifierType = (identifier) => {
    if (validateEmail(identifier)) return "email";
    if (validateMobile(identifier)) return "mobile";
    return null;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.identifier || formData.identifier.trim() === "") {
      newErrors.identifier = "Email or mobile number is required";
    } else {
      const identifierType = getIdentifierType(formData.identifier);
      if (!identifierType) {
        if (/^[0-9]+$/.test(formData.identifier)) {
          newErrors.identifier = "Mobile number must be exactly 10 digits";
        } else {
          newErrors.identifier = "Please enter a valid email address or mobile number";
        }
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.identifier && identifierRef.current) {
        identifierRef.current.focus();
      } else if (newErrors.password && passwordRef.current) {
        passwordRef.current.focus();
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    try {
      if (validateForm()) {
        dispatch(loginStart());
        dispatch(adminUpdateStates({ loading: true }));

        const response = await userLogin({
          email: formData.identifier.trim(),
          password: formData.password,
        });

        if (response.status === 200 && response.data?.statusCode === 200) {
          const { admin, token } = response.data.data;
          dispatch(loginSuccess({ admin, token }));
          setSubmitSuccess(true);
          Toast({
            message: "Logged in successfully",
            type: "success",
          });
          router.push("/");
        } else {
          const errMsg = response.data?.message || "Login failed. Invalid credentials.";
          dispatch(loginFailure());
          Toast({
            message: errMsg,
            type: "error",
          });
        }
      }
    } catch (error) {
      dispatch(loginFailure());
      const errMsg = error?.response?.data?.message || "Login failed. Connection error.";
      Toast({
        message: errMsg,
        type: "error",
      });
    } finally {
      dispatch(adminUpdateStates({ loading: false }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === "identifier") {
      const isMobileInput = /^[0-9]/.test(value) && !value.includes("@");
      if (isMobileInput) {
        processedValue = value.replace(/\D/g, "").slice(0, 10);
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Prevent showing login form momentarily if authenticated
  if (isRehydrated && isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-gray-100 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div
          className="absolute w-96 h-96 bg-gray-100 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-300 p-8 transform transition-all duration-500 hover:scale-[1.02]">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-gray-100 rounded-lg mb-4 transform transition-transform hover:-translate-y-1 hover:scale-105">
              <Lock className="w-8 h-8 text-gray-800" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Login to your Booking Admin account</p>
            <p className="text-xs text-gray-400 mt-1">Hint: Enter any valid email/mobile & 6+ digit password</p>
          </div>

          {submitSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-bounce">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">Login successful!</span>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email or Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                {getIdentifierType(formData.identifier) === "email" ? (
                  <Mail
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                      focusedField === "identifier" ? "text-gray-800" : "text-gray-400"
                    }`}
                  />
                ) : (
                  <Phone
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                      focusedField === "identifier" ? "text-gray-800" : "text-gray-400"
                    }`}
                  />
                )}
                <input
                  ref={identifierRef}
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField("identifier")}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:border transition-all ${
                    errors.identifier
                      ? "border-red-500 focus:border-red-600"
                      : focusedField === "identifier"
                      ? "border-blue-500 bg-gray-50 focus:border-blue-500"
                      : "border-blue-200 hover:border-blue-300 focus:border-blue-500"
                  }`}
                  placeholder="Enter email or mobile number"
                />
              </div>
              {errors.identifier && (
                <p className="mt-2 text-sm text-red-600 animate-pulse">{errors.identifier}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                    focusedField === "password" ? "text-gray-800" : "text-gray-400"
                  }`}
                />
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full pl-11 pr-12 py-3 border rounded-lg focus:outline-none focus:border transition-all ${
                    errors.password
                      ? "border-red-500 focus:border-red-600"
                      : focusedField === "password"
                      ? "border-blue-500 bg-gray-50 focus:border-blue-500"
                      : "border-blue-200 hover:border-blue-300 focus:border-blue-500"
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-800 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 animate-pulse">{errors.password}</p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:bg-gray-800 transform transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader size="sm" speed="fast" variant="white" />
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-gray-700 hover:text-gray-900 font-medium hover:underline transition-colors focus:outline-none"
            >
              Forgot your password?
            </button>
          </div>
        </div>
      </div>

      {showForgotPassword && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          style={{ backgroundColor: "rgba(16, 24, 40, 0.7)" }}
          onClick={() => setShowForgotPassword(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Info className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Forgot Password?</h2>
              </div>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 leading-relaxed">
                If you have forgotten your password, please contact your administrator to reset it.
              </p>
            </div>

            <button
              onClick={() => setShowForgotPassword(false)}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:bg-gray-800 transform transition-all hover:scale-[1.02] active:scale-95"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
