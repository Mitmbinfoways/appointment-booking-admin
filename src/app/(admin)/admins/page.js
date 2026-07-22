"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import Button from "@/components/UI/Button";
import { CustomModal, DeleteConfirmModal } from "@/components/UI/Modal";
import {
  getAdminsList,
  registerAdmin,
  toggleAdminActive,
  toggleAdminApiCredentials,
  updateAdmin,
  deleteAdmin,
} from "@/config/AxiosConfig";
import { Toast } from "@/components/Toast";
import { format, parseISO } from "date-fns";
import { Table, THead, TBody, TR, TD, TH } from "@/components/UI/table";
import { Eye, EyeOff, Copy, Check } from "lucide-react";

export default function AdminsPage() {
  const [adminsList, setAdminsList] = useState([]);
  const [visibleSecrets, setVisibleSecrets] = useState({});
  const [copiedField, setCopiedField] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSecretVisibility = (id) => {
    setVisibleSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    Toast({ message: `${label} copied to clipboard!`, type: "success" });
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Modals visibility states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    businessName: "",
    phoneNumber: "",
    timezone: "Asia/Kolkata",
  });

  const [editFormData, setEditFormData] = useState({
    username: "",
    email: "",
    businessName: "",
    phoneNumber: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [editFormErrors, setEditFormErrors] = useState({});

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminsList();
      if (res.status === 200 && res.data?.statusCode === 200) {
        setAdminsList(res.data.data);
      } else {
        Toast({ message: res.data?.message || "Failed to fetch admins", type: "error" });
      }
    } catch (err) {
      console.error("Error fetching admins:", err);
      Toast({ message: "Failed to connect to server.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleToggleActive = async (adminId) => {
    try {
      const res = await toggleAdminActive(adminId);
      if (res.status === 200 && res.data?.statusCode === 200) {
        Toast({ message: res.data.message || "Admin status updated", type: "success" });
        fetchAdmins();
      } else {
        Toast({ message: res.data?.message || "Failed to toggle status", type: "error" });
      }
    } catch (err) {
      console.error("Error toggling active state:", err);
      Toast({ message: "Failed to toggle status.", type: "error" });
    }
  };

  const handleToggleCredentials = async (adminId) => {
    try {
      const res = await toggleAdminApiCredentials(adminId);
      if (res.status === 200 && res.data?.statusCode === 200) {
        Toast({ message: res.data.message || "Credentials visibility updated", type: "success" });
        fetchAdmins();
      } else {
        Toast({ message: res.data?.message || "Failed to toggle credentials visibility", type: "error" });
      }
    } catch (err) {
      console.error("Error toggling credentials visibility:", err);
      Toast({ message: "Failed to toggle credentials visibility.", type: "error" });
    }
  };

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === "phoneNumber") {
      processedValue = value.replace(/\D/g, "").slice(0, 10);
    }
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === "phoneNumber") {
      processedValue = value.replace(/\D/g, "").slice(0, 10);
    }
    setEditFormData((prev) => ({ ...prev, [name]: processedValue }));
    if (editFormErrors[name]) {
      setEditFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    let firstErrorKey = null;

    if (!formData.username.trim()) {
      errors.username = "Username is required";
      if (!firstErrorKey) firstErrorKey = "create-username";
    }

    if (!formData.email.trim()) {
      errors.email = "Email Address is required";
      if (!firstErrorKey) firstErrorKey = "create-email";
    } else {
      const emailRegex = /^[a-zA-Z0-9]+([._%+-]?[a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-]?[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = "Please enter a valid email address";
        if (!firstErrorKey) firstErrorKey = "create-email";
      }
    }

    if (!formData.password) {
      errors.password = "Password is required";
      if (!firstErrorKey) firstErrorKey = "create-password";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
      if (!firstErrorKey) firstErrorKey = "create-password";
    }

    if (!formData.businessName.trim()) {
      errors.businessName = "Business Name is required";
      if (!firstErrorKey) firstErrorKey = "create-businessName";
    }

    if (formData.phoneNumber && formData.phoneNumber.trim() !== "") {
      if (formData.phoneNumber.length !== 10 || !/^\d{10}$/.test(formData.phoneNumber)) {
        errors.phoneNumber = "Phone number must be 10 digits";
        if (!firstErrorKey) firstErrorKey = "create-phoneNumber";
      }
    }

    setFormErrors(errors);

    if (firstErrorKey) {
      setTimeout(() => {
        const el = document.getElementById(firstErrorKey);
        if (el) el.focus();
      }, 50);
      return;
    }

    try {
      const res = await registerAdmin(formData);
      if (res.status === 201 && res.data?.statusCode === 201) {
        Toast({ message: "Admin account registered successfully", type: "success" });
        setIsModalOpen(false);
        setFormErrors({});
        setFormData({
          username: "",
          email: "",
          password: "",
          businessName: "",
          phoneNumber: "",
          timezone: "Asia/Kolkata",
        });
        fetchAdmins();
      } else {
        Toast({ message: res.data?.message || "Failed to create Admin", type: "error" });
      }
    } catch (err) {
      console.error("Error registering admin:", err);
      const errMsg = err?.response?.data?.message || "Error creating Admin account.";
      Toast({ message: errMsg, type: "error" });
    }
  };

  const handleEditClick = (admin) => {
    setSelectedAdmin(admin);
    setEditFormErrors({});
    setEditFormData({
      username: admin.username,
      email: admin.email,
      businessName: admin.businessName || "",
      phoneNumber: admin.phoneNumber || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    let firstErrorKey = null;

    if (!editFormData.username.trim()) {
      errors.username = "Username is required";
      if (!firstErrorKey) firstErrorKey = "edit-username";
    }

    if (!editFormData.email.trim()) {
      errors.email = "Email Address is required";
      if (!firstErrorKey) firstErrorKey = "edit-email";
    } else {
      const emailRegex = /^[a-zA-Z0-9]+([._%+-]?[a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-]?[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(editFormData.email.trim())) {
        errors.email = "Please enter a valid email address";
        if (!firstErrorKey) firstErrorKey = "edit-email";
      }
    }

    if (!editFormData.businessName.trim()) {
      errors.businessName = "Business Name is required";
      if (!firstErrorKey) firstErrorKey = "edit-businessName";
    }

    if (editFormData.phoneNumber && editFormData.phoneNumber.trim() !== "") {
      if (editFormData.phoneNumber.length !== 10 || !/^\d{10}$/.test(editFormData.phoneNumber)) {
        errors.phoneNumber = "Phone number must be 10 digits";
        if (!firstErrorKey) firstErrorKey = "edit-phoneNumber";
      }
    }

    setEditFormErrors(errors);

    if (firstErrorKey) {
      setTimeout(() => {
        const el = document.getElementById(firstErrorKey);
        if (el) el.focus();
      }, 50);
      return;
    }

    try {
      const res = await updateAdmin(selectedAdmin._id, editFormData);
      if (res.status === 200 && res.data?.statusCode === 200) {
        Toast({ message: "Admin account updated successfully", type: "success" });
        setIsEditModalOpen(false);
        setEditFormErrors({});
        fetchAdmins();
      } else {
        Toast({ message: res.data?.message || "Failed to update Admin", type: "error" });
      }
    } catch (err) {
      console.error("Error updating admin:", err);
      const errMsg = err?.response?.data?.message || "Error updating Admin account.";
      Toast({ message: errMsg, type: "error" });
    }
  };

  const handleDeleteClick = (admin) => {
    setSelectedAdmin(admin);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await deleteAdmin(selectedAdmin._id);
      if (res.status === 200 && res.data?.statusCode === 200) {
        Toast({ message: "Admin account deleted successfully", type: "success" });
        setIsDeleteModalOpen(false);
        fetchAdmins();
      } else {
        Toast({ message: res.data?.message || "Failed to delete Admin", type: "error" });
      }
    } catch (err) {
      console.error("Error deleting admin:", err);
      const errMsg = err?.response?.data?.message || "Error deleting Admin account.";
      Toast({ message: errMsg, type: "error" });
    }
  };

  return (
    <>
      <PageMeta title="Admins - SuperAdmin Control Panel" description="Manage sub-admin profiles" />
      <PageBreadcrumb
        items={[{ label: "Home", to: "/" }, { label: "Admins Management", to: "/admins" }]}
      />

      <div className="bg-white rounded-lg border border-gray-200 shadow-theme-xs">
        {/* Header Section */}
        <div className="flex flex-col gap-4 p-4 border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Admin Accounts</h3>
            <p className="text-sm text-gray-500">Create, review, edit, and toggle active status of sub-admin accounts.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} variant="primary" size="md">
            Create Admin
          </Button>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <THead>
              <TR>
                <TH>Sr No</TH>
                <TH>Admin ID</TH>
                <TH>Username</TH>
                <TH>Email</TH>
                <TH>Phone Number</TH>
                <TH>Business Name</TH>
                <TH>Secret Key</TH>
                <TH>Show Credentials</TH>
                <TH>Created Date</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {isLoading ? (
                <TR>
                  <TD colSpan={11} className="px-6 py-10 text-center text-gray-400 text-sm">
                    Loading admin list...
                  </TD>
                </TR>
              ) : adminsList.length === 0 ? (
                <TR>
                  <TD colSpan={11} className="px-6 py-10 text-center text-gray-400 text-sm">
                    No Admin profiles found.
                  </TD>
                </TR>
              ) : (
                adminsList.map((admin, index) => (
                  <TR key={admin._id}>
                    <TD className="text-sm text-gray-500">{index + 1}</TD>
                    <TD className="text-sm font-mono text-[11px] text-gray-700">
                      <div className="flex items-center gap-1.5 w-fit">
                        <span className="select-all">{admin._id}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(admin._id, `Admin ID (${admin.username})`)}
                          className="text-gray-400 hover:text-blue-600 focus:outline-none cursor-pointer p-0.5 inline-flex items-center"
                          title="Copy Admin ID"
                        >
                          {copiedField === `Admin ID (${admin.username})` ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </TD>
                    <TD className="text-sm font-semibold text-gray-900">{admin.username}</TD>
                    <TD className="text-sm text-gray-700">{admin.email}</TD>
                    <TD className="text-sm text-gray-600">{admin.phoneNumber || "--"}</TD>
                    <TD className="text-sm text-gray-600">{admin.businessName}</TD>
                    <TD className="text-sm">
                      <div className="flex items-center gap-1.5 w-fit">
                        <span className="font-mono text-[11px] text-gray-700 select-all">
                          {visibleSecrets[admin._id] ? admin.secretKey : "••••••••••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSecretVisibility(admin._id)}
                          className="text-gray-400 hover:text-blue-600 focus:outline-none cursor-pointer p-0.5 inline-flex items-center"
                          title={visibleSecrets[admin._id] ? "Hide Secret Key" : "Show Secret Key"}
                        >
                          {visibleSecrets[admin._id] ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(admin.secretKey, `Secret Key (${admin.username})`)}
                          className="text-gray-400 hover:text-blue-600 focus:outline-none cursor-pointer p-0.5 inline-flex items-center"
                          title="Copy Secret Key"
                        >
                          {copiedField === `Secret Key (${admin.username})` ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </TD>
                    <TD>
                      <button
                        type="button"
                        onClick={() => handleToggleCredentials(admin._id)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${admin.showApiCredentials ? "bg-blue-600" : "bg-gray-200"
                          }`}
                        title={admin.showApiCredentials ? "API Credentials Visible on Admin Profile (Click to Hide)" : "API Credentials Hidden from Admin Profile (Click to Show)"}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${admin.showApiCredentials ? "translate-x-5" : "translate-x-0"
                            }`}
                        />
                      </button>
                    </TD>
                    <TD className="text-sm text-gray-500">
                      {admin.createdAt ? format(new Date(admin.createdAt), "dd-MM-yyyy") : "N/A"}
                    </TD>
                    <TD>
                      <button
                        onClick={() => handleToggleActive(admin._id)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${admin.isActive ? "bg-blue-600" : "bg-gray-200"
                          }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${admin.isActive ? "translate-x-5" : "translate-x-0"
                            }`}
                        />
                      </button>
                    </TD>
                    <TD>
                      <div className="flex items-center justify-end gap-4 font-medium text-right text-xs">
                        <Link
                          href={`/admins/${admin._id}/form`}
                          title="Form Config"
                          className="text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/admins/${admin._id}/slots`}
                          title="Slots Settings"
                          className="text-gray-500 hover:text-emerald-600 transition-colors cursor-pointer"
                        >
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/admins/${admin._id}/holidays`}
                          title="Holiday Management"
                          className="text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/admins/appointments-list/${admin._id}`}
                          title="Appointments List"
                          className="text-gray-500 hover:text-amber-500 transition-colors cursor-pointer"
                        >
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleEditClick(admin)}
                          title="Edit Profile"
                          className="text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(admin)}
                          title="Delete Account"
                          className="text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </div>
      </div>

      {/* Creation Modal */}
      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="w-full">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Create Sub-Admin</h3>
            <p className="text-sm text-gray-500">Add a new admin account to deploy their booking slots.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                id="create-username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none ${formErrors.username ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
                  }`}
                placeholder="e.g. clinic_admin"
              />
              {formErrors.username && (
                <p className="mt-1.5 text-xs text-red-500 font-bold">{formErrors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="create-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none ${formErrors.email ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
                  }`}
                placeholder="e.g. admin@clinic.com"
              />
              {formErrors.email && (
                <p className="mt-1.5 text-xs text-red-500 font-bold">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="create-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none ${formErrors.password ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
                  }`}
                placeholder="••••••••"
              />
              {formErrors.password && (
                <p className="mt-1.5 text-xs text-red-500 font-bold">{formErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                id="create-businessName"
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none ${formErrors.businessName ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
                  }`}
                placeholder="e.g. Apollo Clinic"
              />
              {formErrors.businessName && (
                <p className="mt-1.5 text-xs text-red-500 font-bold">{formErrors.businessName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Phone Number
              </label>
              <input
                id="create-phoneNumber"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                name="phoneNumber"
                value={formData.phoneNumber}
                onKeyDown={handlePhoneKeyDown}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none ${formErrors.phoneNumber ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
                  }`}
                placeholder="e.g. 9898989801"
              />
              {formErrors.phoneNumber && (
                <p className="mt-1.5 text-xs text-red-500 font-bold">{formErrors.phoneNumber}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
              <Button type="button" variant="secondary" size="md" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md">
                Register Admin
              </Button>
            </div>
          </form>
        </div>
      </CustomModal>

      {/* Edit Modal */}
      <CustomModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <div className="w-full">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Edit Sub-Admin</h3>
            <p className="text-sm text-gray-500">Update admin credentials and business details.</p>
          </div>

          <form onSubmit={handleEditSubmit} noValidate className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-username"
                type="text"
                name="username"
                value={editFormData.username}
                onChange={handleEditInputChange}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none ${editFormErrors.username ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
                  }`}
              />
              {editFormErrors.username && (
                <p className="mt-1.5 text-xs text-red-500 font-bold">{editFormErrors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-email"
                type="email"
                name="email"
                value={editFormData.email}
                onChange={handleEditInputChange}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none ${editFormErrors.email ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
                  }`}
              />
              {editFormErrors.email && (
                <p className="mt-1.5 text-xs text-red-500 font-bold">{editFormErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-businessName"
                type="text"
                name="businessName"
                value={editFormData.businessName}
                onChange={handleEditInputChange}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none ${editFormErrors.businessName ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
                  }`}
              />
              {editFormErrors.businessName && (
                <p className="mt-1.5 text-xs text-red-500 font-bold">{editFormErrors.businessName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Phone Number
              </label>
              <input
                id="edit-phoneNumber"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                name="phoneNumber"
                value={editFormData.phoneNumber}
                onKeyDown={handlePhoneKeyDown}
                onChange={handleEditInputChange}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none ${editFormErrors.phoneNumber ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
                  }`}
                placeholder="e.g. 9898989801"
              />
              {editFormErrors.phoneNumber && (
                <p className="mt-1.5 text-xs text-red-500 font-bold">{editFormErrors.phoneNumber}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
              <Button type="button" variant="secondary" size="md" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </CustomModal>

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Admin Profile"
        message="Are you sure you want to delete this Admin account? This action will set the account to deleted and inactive, preventing any future logins."
        itemName={selectedAdmin?.username || ""}
      />
    </>
  );
}
