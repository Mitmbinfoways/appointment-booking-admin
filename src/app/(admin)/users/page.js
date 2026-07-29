"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import Button from "@/components/UI/Button";
import { CustomModal, DeleteConfirmModal } from "@/components/UI/Modal";
import { Table, THead, TBody, TR, TD, TH } from "@/components/UI/table";
import { Toast } from "@/components/Toast";
import { format } from "date-fns";
import {
  getSubUsersListApi,
  createSubUserRecord,
  updateSubUserRecord,
  toggleSubUserActiveApi,
  deleteSubUserRecord,
  getUserModulesApi,
} from "@/config/AxiosConfig";
import {
  Users,
  Search,
  Pencil,
  Trash2,
  AlertTriangle,
  UserCheck,
  UserX,
  ShieldCheck,
  Mail,
  Phone,
} from "lucide-react";

export default function UserManagementPage() {
  const adminState = useSelector((state) => state.admin) || {};
  const admin = adminState.admin;
  const adminId = admin?._id;

  const [hasAccess, setHasAccess] = useState(true);
  const [subUsers, setSubUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    role: "Staff",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    role: "Staff",
  });

  const [formErrors, setFormErrors] = useState({});

  // Check module access & fetch sub-users
  const fetchSubUsers = async () => {
    if (!adminId) return;
    setIsLoading(true);
    try {
      const moduleRes = await getUserModulesApi(adminId);
      if (moduleRes.status === 200 && moduleRes.data?.data) {
        if (!moduleRes.data.data.userManagementModule) {
          setHasAccess(false);
          setIsLoading(false);
          return;
        }
      }

      const res = await getSubUsersListApi(adminId);
      if (res.status === 200 && res.data?.data) {
        setSubUsers(res.data.data);
        setHasAccess(true);
      } else {
        Toast({ message: res.data?.message || "Failed to load sub-users", type: "error" });
      }
    } catch (err) {
      console.error("Error fetching sub-users:", err);
      if (err?.response?.status === 403) {
        setHasAccess(false);
      } else {
        Toast({ message: "Failed to connect to server.", type: "error" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubUsers();
  }, [adminId]);

  const roles = ["All", ...Array.from(new Set(subUsers.map((u) => u.role || "Staff")))];

  const filteredUsers = subUsers.filter((usr) => {
    const matchesSearch =
      usr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usr.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (usr.phoneNumber && usr.phoneNumber.includes(searchQuery));

    const matchesRole = roleFilter === "All" || (usr.role || "Staff") === roleFilter;

    return matchesSearch && matchesRole;
  });

  const validateForm = (data) => {
    const errors = {};
    if (!data.name.trim()) errors.name = "Full name is required";
    if (!data.email.trim()) {
      errors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      errors.email = "Invalid email address format";
    }
    return errors;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const res = await createSubUserRecord({ ...formData, adminId });
      if (res.status === 201 && res.data?.statusCode === 201) {
        Toast({ message: "Sub-user created successfully!", type: "success" });
        setIsAddModalOpen(false);
        fetchSubUsers();
      } else {
        Toast({ message: res.data?.message || "Failed to create sub-user", type: "error" });
      }
    } catch (err) {
      console.error("Error creating sub-user:", err);
      Toast({ message: "Failed to create user record.", type: "error" });
    }
  };

  const handleEditClick = (usr) => {
    setSelectedUser(usr);
    setEditFormData({
      name: usr.name || "",
      email: usr.email || "",
      phoneNumber: usr.phoneNumber || "",
      role: usr.role || "Staff",
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    const errors = validateForm(editFormData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const res = await updateSubUserRecord(selectedUser._id, editFormData);
      if (res.status === 200) {
        Toast({ message: "User record updated successfully!", type: "success" });
        setIsEditModalOpen(false);
        fetchSubUsers();
      } else {
        Toast({ message: res.data?.message || "Failed to update user", type: "error" });
      }
    } catch (err) {
      console.error("Error updating sub-user:", err);
      Toast({ message: "Failed to update user record.", type: "error" });
    }
  };

  const handleToggleActive = async (subUserId) => {
    try {
      const res = await toggleSubUserActiveApi(subUserId);
      if (res.status === 200) {
        Toast({ message: "User active status updated!", type: "success" });
        setSubUsers((prev) =>
          prev.map((u) => (u._id === subUserId ? { ...u, isActive: !u.isActive } : u))
        );
      } else {
        Toast({ message: res.data?.message || "Failed to toggle status", type: "error" });
      }
    } catch (err) {
      console.error("Error toggling user active:", err);
      Toast({ message: "Failed to toggle status.", type: "error" });
    }
  };

  const handleDeleteClick = (usr) => {
    setSelectedUser(usr);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    try {
      const res = await deleteSubUserRecord(selectedUser._id);
      if (res.status === 200) {
        Toast({ message: "User record deleted successfully!", type: "success" });
        setIsDeleteModalOpen(false);
        fetchSubUsers();
      } else {
        Toast({ message: res.data?.message || "Failed to delete user", type: "error" });
      }
    } catch (err) {
      console.error("Error deleting sub-user:", err);
      Toast({ message: "Failed to delete user record.", type: "error" });
    }
  };

  // Overview metrics
  const totalCount = subUsers.length;
  const activeCount = subUsers.filter((u) => u.isActive).length;
  const inactiveCount = subUsers.filter((u) => !u.isActive).length;
  const staffCount = subUsers.filter((u) => u.role === "Staff" || u.role === "Receptionist" || u.role === "Assistant").length;

  if (!hasAccess) {
    return (
      <div className="p-6 space-y-6">
        <PageMeta title="User Management" description="Manage clinic sub-users and staff" />
        <PageBreadcrumb items={[{ label: "Home", to: "/" }, { label: "User Management" }]} />

        <div className="mt-8 bg-white rounded-lg p-12 border border-gray-200 text-center max-w-xl mx-auto shadow-theme-xs">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            User Management Module Disabled
          </h2>
          <p className="text-sm text-gray-500">
            The User Management module is currently not enabled for your account. Please contact your SuperAdmin to enable access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageMeta title="User Management" description="Manage clinic sub-users and staff" />
      <PageBreadcrumb items={[{ label: "Home", to: "/" }, { label: "User Management" }]} />

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-theme-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Total Sub-Users
            </span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">{totalCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-theme-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Active Users
            </span>
            <span className="text-2xl font-bold text-green-600 mt-1 block">{activeCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-theme-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Inactive Users
            </span>
            <span className="text-2xl font-bold text-red-600 mt-1 block">{inactiveCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-theme-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Staff Members
            </span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">{staffCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card (Matches Project Theme layout) */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-theme-xs">
        {/* Header Section */}
        <div className="flex flex-col gap-4 p-4 border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-full sm:w-60"
            />
            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0">
                ROLE:
              </span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-700 bg-white cursor-pointer"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={() => {
              setFormData({ name: "", email: "", phoneNumber: "", role: "Staff" });
              setFormErrors({});
              setIsAddModalOpen(true);
            }}
            variant="primary"
            size="md"
            className="shrink-0"
          >
            Create Sub-User
          </Button>
        </div>

        {/* Sub-Users Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <THead>
              <TR>
                <TH>#</TH>
                <TH>NAME</TH>
                <TH>EMAIL</TH>
                <TH>PHONE NUMBER</TH>
                <TH>ROLE / DESIGNATION</TH>
                <TH>CREATED DATE</TH>
                <TH>STATUS</TH>
                <TH className="text-right">ACTIONS</TH>
              </TR>
            </THead>
            <TBody>
              {isLoading ? (
                <TR>
                  <TD colSpan={8} className="py-10 text-center text-gray-400 text-sm">
                    Loading sub-users list...
                  </TD>
                </TR>
              ) : filteredUsers.length === 0 ? (
                <TR>
                  <TD colSpan={8} className="py-10 text-center text-gray-400 text-sm">
                    No user records found.
                  </TD>
                </TR>
              ) : (
                filteredUsers.map((usr, idx) => (
                  <TR key={usr._id}>
                    <TD className="text-sm text-gray-500">{idx + 1}</TD>
                    <TD className="text-sm font-semibold text-gray-900">{usr.name}</TD>
                    <TD className="text-sm text-gray-700">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        {usr.email}
                      </span>
                    </TD>
                    <TD className="text-sm text-gray-600">
                      {usr.phoneNumber ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {usr.phoneNumber}
                        </span>
                      ) : (
                        "--"
                      )}
                    </TD>
                    <TD className="text-sm">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                        {usr.role || "Staff"}
                      </span>
                    </TD>
                    <TD className="text-sm text-gray-500">
                      {usr.createdAt ? format(new Date(usr.createdAt), "dd-MM-yyyy") : "--"}
                    </TD>
                    <TD>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(usr._id)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                          usr.isActive ? "bg-blue-600" : "bg-gray-200"
                        }`}
                        title={usr.isActive ? "Active (Click to Deactivate)" : "Inactive (Click to Activate)"}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            usr.isActive ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(usr)}
                          className="p-1 text-gray-400 hover:text-blue-600 focus:outline-none cursor-pointer"
                          title="Edit User"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(usr)}
                          className="p-1 text-gray-400 hover:text-red-600 focus:outline-none cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal - Add User */}
      <CustomModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Sub-User"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
            {formErrors.name && <p className="text-xs text-red-500 mt-1 font-bold">{formErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="e.g. staff@clinic.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
            {formErrors.email && <p className="text-xs text-red-500 mt-1 font-bold">{formErrors.email}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +1234567890"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Role / Designation</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="Staff">Staff</option>
                <option value="Receptionist">Receptionist</option>
                <option value="Assistant">Assistant</option>
                <option value="Nurse">Nurse</option>
                <option value="Pharmacist">Pharmacist</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" onClick={() => setIsAddModalOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save User
            </Button>
          </div>
        </form>
      </CustomModal>

      {/* Modal - Edit User */}
      <CustomModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User Details"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
            {formErrors.name && <p className="text-xs text-red-500 mt-1 font-bold">{formErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
            {formErrors.email && <p className="text-xs text-red-500 mt-1 font-bold">{formErrors.email}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={editFormData.phoneNumber}
                onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Role / Designation</label>
              <select
                value={editFormData.role}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="Staff">Staff</option>
                <option value="Receptionist">Receptionist</option>
                <option value="Assistant">Assistant</option>
                <option value="Nurse">Nurse</option>
                <option value="Pharmacist">Pharmacist</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" onClick={() => setIsEditModalOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Update User
            </Button>
          </div>
        </form>
      </CustomModal>

      {/* Modal - Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete User Record"
        message={`Are you sure you want to delete '${selectedUser?.name}'? This action cannot be undone.`}
      />
    </div>
  );
}
