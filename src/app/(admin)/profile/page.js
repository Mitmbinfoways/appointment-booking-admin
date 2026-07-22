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

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancelEdit = () => {
    if (originalProfileData) {
      setProfileData(originalProfileData);
    }
    setIsEditing(false);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.username || !profileData.email) {
      Toast({ message: "Username and Email are required.", type: "error" });
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
        dispatch(setAdmin(user)); // Update global Redux header profile state immediately
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
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Toast({ message: "All password fields are required.", type: "error" });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Toast({ message: "New passwords do not match.", type: "error" });
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

          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
              {isEditing ? (
                <input
                  type="text"
                  name="username"
                  value={profileData.username}
                  onChange={handleProfileInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                />
              ) : (
                <p className="w-full px-4 py-2 border border-gray-100 bg-gray-50/50 rounded-lg text-sm text-gray-800 font-medium">
                  {profileData.username || "N/A"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                />
              ) : (
                <p className="w-full px-4 py-2 border border-gray-100 bg-gray-50/50 rounded-lg text-sm text-gray-800 font-medium">
                  {profileData.email || "N/A"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
              {isEditing ? (
                <input
                  type="text"
                  name="phoneNumber"
                  value={profileData.phoneNumber}
                  onChange={handleProfileInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                />
              ) : (
                <p className="w-full px-4 py-2 border border-gray-100 bg-gray-50/50 rounded-lg text-sm text-gray-800 font-medium">
                  {profileData.phoneNumber || "N/A"}
                </p>
              )}
            </div>

            {profileData.role === "Admin" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="businessName"
                    value={profileData.businessName}
                    onChange={handleProfileInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                  />
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
                  setIsEditingPassword(false);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 font-semibold cursor-pointer focus:outline-none"
              >
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Password</label>
                  <input
                    type="password"
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordInputChange}
                    required
                    placeholder="Enter current password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    required
                    placeholder="Enter new password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    required
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                  />
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
