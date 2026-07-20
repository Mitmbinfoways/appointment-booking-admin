"use client";

import React, { useState, useEffect } from "react";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import Button from "@/components/UI/Button";
import { getProfile, updateUserProfile, updateUserPassword } from "@/config/AxiosConfig";
import { Toast } from "@/components/Toast";
import { useDispatch } from "react-redux";
import { setAdmin } from "@/store/slices/authSlice";

export default function ProfilePage() {
  const dispatch = useDispatch();

  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    businessName: "",
    phoneNumber: "",
    role: "",
  });

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

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await getProfile();
      if (res.status === 200 && res.data?.statusCode === 200) {
        const user = res.data.data;
        const profileObj = {
          username: user.username || "",
          email: user.email || "",
          businessName: user.businessName || "",
          phoneNumber: user.phoneNumber || "",
          role: user.role || "",
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
          username: user.username || "",
          email: user.email || "",
          businessName: user.businessName || "",
          phoneNumber: user.phoneNumber || "",
          role: user.role || "",
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
      </div>
    </>
  );
}
