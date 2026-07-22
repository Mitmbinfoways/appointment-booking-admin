"use client";

import React, { useState, useEffect } from "react";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import Button from "@/components/UI/Button";
import { getProfile, updateUserProfile, updateUserPassword } from "@/config/AxiosConfig";
import { Toast } from "@/components/Toast";
import { useDispatch } from "react-redux";
import { setAdmin } from "@/store/slices/authSlice";
import { Copy, Check, Eye, EyeOff, ExternalLink } from "lucide-react";

export default function ProfilePage() {
  const dispatch = useDispatch();

  const [profileData, setProfileData] = useState({
    id: "",
    username: "",
    email: "",
    businessName: "",
    phoneNumber: "",
    role: "",
    secretKey: "",
  });

  const [showSecretKey, setShowSecretKey] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const [originalProfileData, setOriginalProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isEditingPassword, setIsEditingPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    Toast({ message: `${fieldName} copied to clipboard!`, type: "success" });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await getProfile();
      if (res.status === 200 && res.data?.statusCode === 200) {
        const user = res.data.data;
        const profileObj = {
          id: user._id || "",
          username: user.username || "",
          email: user.email || "",
          businessName: user.businessName || "",
          phoneNumber: user.phoneNumber || "",
          role: user.role || "",
          secretKey: user.secretKey || "",
          showApiCredentials: user.showApiCredentials || false,
        };
        setProfileData(profileObj);
        setOriginalProfileData(profileObj);
        dispatch(setAdmin(user));
      } else {
        Toast({ message: res.data?.message || "Failed to fetch profile", type: "error" });
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      Toast({ message: "Failed to connect to backend.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handlePhoneKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) return;
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
      "Enter",
      "Home",
      "End",
    ];
    if (allowedKeys.includes(e.key)) return;
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === "phoneNumber") {
      processedValue = value.replace(/\D/g, "").slice(0, 10);
    }
    setProfileData((prev) => ({ ...prev, [name]: processedValue }));
    if (profileErrors[name]) {
      setProfileErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCancelEdit = () => {
    if (originalProfileData) {
      setProfileData(originalProfileData);
    }
    setProfileErrors({});
    setIsEditing(false);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!profileData.username || profileData.username.trim() === "") {
      newErrors.username = "Username is required";
    }

    if (!profileData.email || profileData.email.trim() === "") {
      newErrors.email = "Email Address is required";
    } else {
      const emailRegex = /^[a-zA-Z0-9]+([._%+-]?[a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-]?[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(profileData.email.trim())) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (profileData.phoneNumber && profileData.phoneNumber.trim() !== "") {
      if (profileData.phoneNumber.length !== 10 || !/^\d{10}$/.test(profileData.phoneNumber)) {
        newErrors.phoneNumber = "Phone number must be 10 digits";
      }
    }

    if (profileData.role === "Admin" && (!profileData.businessName || profileData.businessName.trim() === "")) {
      newErrors.businessName = "Business Name is required";
    }

    setProfileErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      const el = document.getElementsByName(firstKey)?.[0];
      if (el) el.focus();
      return;
    }

    setIsLoading(true);
    try {
      const res = await updateUserProfile({
        username: profileData.username,
        email: profileData.email,
        businessName: profileData.businessName,
        phoneNumber: profileData.phoneNumber,
      });

      if (res.status === 200 && res.data?.statusCode === 200) {
        Toast({ message: "Profile updated successfully.", type: "success" });
        const user = res.data.data;
        const profileObj = {
          id: user._id || profileData.id || "",
          username: user.username || "",
          email: user.email || "",
          businessName: user.businessName || "",
          phoneNumber: user.phoneNumber || "",
          role: user.role || "",
          secretKey: user.secretKey || profileData.secretKey || "",
          showApiCredentials: user.showApiCredentials ?? profileData.showApiCredentials ?? false,
        };
        setProfileData(profileObj);
        setOriginalProfileData(profileObj);
        setIsEditing(false);
        dispatch(setAdmin(user));
      } else {
        Toast({ message: res.data?.message || "Failed to update profile", type: "error" });
      }
    } catch (err) {
      console.error("Error saving profile details:", err);
      const errMsg = err?.response?.data?.message || "Error updating profile.";
      Toast({ message: errMsg, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!passwordData.oldPassword) {
      newErrors.oldPassword = "Current Password is required";
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = "New Password is required";
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = "Confirm New Password is required";
    } else if (passwordData.newPassword && passwordData.confirmPassword !== passwordData.newPassword) {
      newErrors.confirmPassword = "New passwords do not match";
    }

    setPasswordErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      const el = document.getElementsByName(firstKey)?.[0];
      if (el) el.focus();
      return;
    }

    setIsPasswordLoading(true);
    try {
      const res = await updateUserPassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });

      if (res.status === 200 && res.data?.statusCode === 200) {
        Toast({ message: "Password updated successfully.", type: "success" });
        setPasswordData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordErrors({});
        setIsEditingPassword(false);
      } else {
        Toast({ message: res.data?.message || "Failed to change password.", type: "error" });
      }
    } catch (err) {
      console.error("Error changing password:", err);
      const errMsg = err?.response?.data?.message || "Error updating password.";
      Toast({ message: errMsg, type: "error" });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const clientBaseUrl = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : "http://localhost:3000";
  const bookingUrl = (profileData.id && profileData.secretKey)
    ? `${clientBaseUrl}/?adminId=${profileData.id}&key=${profileData.secretKey}`
    : "";

  return (
    <>
      <PageMeta title="My Profile - Settings" description="Edit account profile and security settings" />
      <PageBreadcrumb
        items={[{ label: "Home", to: "/" }, { label: "My Profile", to: "/profile" }]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Personal Details Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-theme-xs p-6 self-start">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              <p className="text-sm text-gray-500">Update your username, email address, and business properties.</p>
            </div>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold cursor-pointer focus:outline-none"
              >
                Edit
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-sm text-gray-500 hover:text-gray-700 font-semibold cursor-pointer focus:outline-none"
              >
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleProfileSubmit} noValidate className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Username <span className="text-red-500 font-semibold">*</span>
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="username"
                    value={profileData.username}
                    onChange={handleProfileInputChange}
                    className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none bg-white ${profileErrors.username ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
                      }`}
                  />
                  {profileErrors.username && (
                    <p className="mt-1.5 text-xs text-red-500 font-bold">{profileErrors.username}</p>
                  )}
                </div>
              ) : (
                <p className="w-full px-4 py-2 border border-gray-100 bg-gray-50/50 rounded-lg text-sm text-gray-800 font-medium">
                  {profileData.username || "N/A"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address <span className="text-red-500 font-semibold">*</span>
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileInputChange}
                    className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none bg-white ${profileErrors.email ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
                      }`}
                  />
                  {profileErrors.email && (
                    <p className="mt-1.5 text-xs text-red-500 font-bold">{profileErrors.email}</p>
                  )}
                </div>
              ) : (
                <p className="w-full px-4 py-2 border border-gray-100 bg-gray-50/50 rounded-lg text-sm text-gray-800 font-medium">
                  {profileData.email || "N/A"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
              {isEditing ? (
                <div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    name="phoneNumber"
                    value={profileData.phoneNumber}
                    onKeyDown={handlePhoneKeyDown}
                    onChange={handleProfileInputChange}
                    placeholder="Enter 10-digit phone number"
                    className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none bg-white ${profileErrors.phoneNumber ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
                      }`}
                  />
                  {profileErrors.phoneNumber && (
                    <p className="mt-1.5 text-xs text-red-500 font-bold">{profileErrors.phoneNumber}</p>
                  )}
                </div>
              ) : (
                <p className="w-full px-4 py-2 border border-gray-100 bg-gray-50/50 rounded-lg text-sm text-gray-800 font-medium">
                  {profileData.phoneNumber || "N/A"}
                </p>
              )}
            </div>

            {profileData.role === "Admin" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Business Name <span className="text-red-500 font-semibold">*</span>
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      name="businessName"
                      value={profileData.businessName}
                      onChange={handleProfileInputChange}
                      className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none bg-white ${profileErrors.businessName ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
                        }`}
                    />
                    {profileErrors.businessName && (
                      <p className="mt-1.5 text-xs text-red-500 font-bold">{profileErrors.businessName}</p>
                    )}
                  </div>
                ) : (
                  <p className="w-full px-4 py-2 border border-gray-100 bg-gray-50/50 rounded-lg text-sm text-gray-800 font-medium">
                    {profileData.businessName || "N/A"}
                  </p>
                )}
              </div>
            )}

            {isEditing && (
              <div className="flex justify-end mt-4">
                <Button type="submit" variant="primary" size="md" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-theme-xs p-6 self-start">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
              <p className="text-sm text-gray-500">Reset your login credentials to protect your scheduling metrics.</p>
            </div>
            {!isEditingPassword ? (
              <button
                type="button"
                onClick={() => setIsEditingPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold cursor-pointer focus:outline-none"
              >
                Edit
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
                  setPasswordErrors({});
                  setIsEditingPassword(false);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 font-semibold cursor-pointer focus:outline-none"
              >
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handlePasswordSubmit} noValidate className="flex flex-col gap-4">
            {!isEditingPassword ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <p className="w-full px-4 py-2 border border-gray-100 bg-gray-50/50 rounded-lg text-sm text-gray-800 font-medium">
                  ••••••••
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Current Password <span className="text-red-500 font-semibold">*</span>
                  </label>
                  <input
                    type="password"
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter current password"
                    className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none bg-white ${passwordErrors.oldPassword ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
                      }`}
                  />
                  {passwordErrors.oldPassword && (
                    <p className="mt-1.5 text-xs text-red-500 font-bold">{passwordErrors.oldPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    New Password <span className="text-red-500 font-semibold">*</span>
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter new password"
                    className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none bg-white ${passwordErrors.newPassword ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
                      }`}
                  />
                  {passwordErrors.newPassword && (
                    <p className="mt-1.5 text-xs text-red-500 font-bold">{passwordErrors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Confirm New Password <span className="text-red-500 font-semibold">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Re-enter new password"
                    className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none bg-white ${passwordErrors.confirmPassword ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
                      }`}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-500 font-bold">{passwordErrors.confirmPassword}</p>
                  )}
                </div>
              </>
            )}

            {isEditingPassword && (
              <div className="flex justify-end mt-4">
                <Button type="submit" variant="primary" size="md" disabled={isPasswordLoading}>
                  {isPasswordLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* API & Booking Integration Credentials Card */}
        {(profileData.showApiCredentials || profileData.role === "SuperAdmin") && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-theme-xs p-6 lg:col-span-2">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">API & Integration Credentials</h3>
              <p className="text-sm text-gray-500">
                Your unique Admin ID and Secret Key required for public client booking integration and API requests.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Admin ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Admin ID</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={profileData.id || "N/A"}
                    className="w-full px-4 py-2 border border-gray-200 bg-gray-50/50 rounded-lg text-sm text-gray-800 font-mono focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(profileData.id, "Admin ID")}
                    className="px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                  >
                    {copiedField === "Admin ID" ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                    <span>{copiedField === "Admin ID" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Secret Key */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Secret Key</label>
                <div className="flex items-center gap-2">
                  <div className="relative w-full">
                    <input
                      type={showSecretKey ? "text" : "password"}
                      readOnly
                      value={profileData.secretKey || "N/A"}
                      className="w-full pl-4 pr-10 py-2 border border-gray-200 bg-gray-50/50 rounded-lg text-sm text-gray-800 font-mono focus:outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecretKey((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                      title={showSecretKey ? "Hide Secret Key" : "Show Secret Key"}
                    >
                      {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(profileData.secretKey, "Secret Key")}
                    className="px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                  >
                    {copiedField === "Secret Key" ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                    <span>{copiedField === "Secret Key" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Public Booking Link */}
              {profileData.id && profileData.secretKey && (
                <div className="md:col-span-2 pt-2 border-t border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Public Booking Link</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={bookingUrl}
                      className="w-full px-4 py-2 border border-gray-200 bg-gray-50/50 rounded-lg text-sm text-gray-800 font-mono focus:outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(bookingUrl, "Booking Link")}
                      className="px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                    >
                      {copiedField === "Booking Link" ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                      <span>{copiedField === "Booking Link" ? "Copied" : "Copy Link"}</span>
                    </button>
                    <a
                      href={bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium focus:outline-none flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open Link</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
