"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Table, THead, TBody, TR, TD, TH } from "@/components/UI/table";
import { CustomModal, DeleteConfirmModal } from "@/components/UI/Modal";
import Button from "@/components/UI/Button";
import { Toast } from "@/components/Toast";
import {
  getMedicinesListApi,
  createMedicineRecord,
  updateMedicineRecord,
  deleteMedicineRecord,
} from "@/config/AxiosConfig";
import {
  Search,
  Package,
  AlertTriangle,
  Boxes,
  DollarSign,
  Pencil,
  Trash2,
  CheckCircle2,
} from "lucide-react";

export default function MedicinesPage() {
  const adminState = useSelector((state) => state.admin) || {};
  const admin = adminState.admin;
  const adminId =
    admin?._id ||
    (typeof window !== "undefined" ? localStorage.getItem("adminId") : null);

  const [medicinesList, setMedicinesList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    category: "General",
    stock: 0,
    price: 0,
    expiryDate: "",
    manufacturer: "",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    dosage: "",
    category: "General",
    stock: 0,
    price: 0,
    expiryDate: "",
    manufacturer: "",
  });

  const [formErrors, setFormErrors] = useState({});

  const fetchMedicines = useCallback(async () => {
    if (!adminId) return;
    setIsLoading(true);
    try {
      const res = await getMedicinesListApi(adminId);
      if (res.status === 200 && res.data?.statusCode === 200) {
        setMedicinesList(res.data.data);
      } else {
        Toast({
          message: res.data?.message || "Failed to fetch medicines",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error fetching medicines:", err);
      Toast({ message: "Failed to connect to server.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const categories = [
    "All",
    ...Array.from(new Set(medicinesList.map((m) => m.category || "General"))),
  ];

  const filteredMedicines = medicinesList.filter((med) => {
    const matchesSearch =
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (med.dosage &&
        med.dosage.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (med.manufacturer &&
        med.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      categoryFilter === "All" ||
      (med.category || "General") === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Calculate metrics
  const totalItems = medicinesList.length;
  const outOfStockCount = medicinesList.filter(
    (m) => Number(m.stock) === 0,
  ).length;
  const lowStockCount = medicinesList.filter(
    (m) => Number(m.stock) > 0 && Number(m.stock) <= 10,
  ).length;
  const totalStockValue = medicinesList.reduce(
    (sum, m) => sum + Number(m.stock) * Number(m.price),
    0,
  );

  const validateForm = (data) => {
    const errors = {};
    if (!data.name.trim()) errors.name = "Medicine name is required";
    if (data.stock === "" || Number(data.stock) < 0)
      errors.stock = "Valid stock is required";
    if (data.price === "" || Number(data.price) < 0)
      errors.price = "Valid price is required";
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
      const res = await createMedicineRecord({ ...formData, adminId });
      if (res.status === 201 && res.data?.statusCode === 201) {
        Toast({
          message: "Medicine item added successfully!",
          type: "success",
        });
        setIsAddModalOpen(false);
        fetchMedicines();
      } else {
        Toast({
          message: res.data?.message || "Failed to add medicine",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error creating medicine:", err);
      Toast({ message: "Failed to create medicine item.", type: "error" });
    }
  };

  const handleEditClick = (med) => {
    setSelectedMedicine(med);
    setEditFormData({
      name: med.name || "",
      dosage: med.dosage || "",
      category: med.category || "General",
      stock: med.stock || 0,
      price: med.price || 0,
      expiryDate: med.expiryDate ? med.expiryDate.split("T")[0] : "",
      manufacturer: med.manufacturer || "",
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMedicine) return;

    const errors = validateForm(editFormData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const res = await updateMedicineRecord(selectedMedicine._id, {
        ...editFormData,
        adminId,
      });
      if (res.status === 200) {
        Toast({
          message: "Medicine record updated successfully!",
          type: "success",
        });
        setIsEditModalOpen(false);
        fetchMedicines();
      } else {
        Toast({
          message: res.data?.message || "Failed to update medicine",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error updating medicine:", err);
      Toast({ message: "Failed to update medicine record.", type: "error" });
    }
  };

  const handleDeleteClick = (med) => {
    setSelectedMedicine(med);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedMedicine) return;
    try {
      const res = await deleteMedicineRecord(selectedMedicine._id, adminId);
      if (res.status === 200) {
        Toast({
          message: "Medicine record deleted successfully!",
          type: "success",
        });
        setIsDeleteModalOpen(false);
        fetchMedicines();
      } else {
        Toast({
          message: res.data?.message || "Failed to delete medicine",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error deleting medicine:", err);
      Toast({ message: "Failed to delete medicine item.", type: "error" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageMeta
        title="Medicine Inventory"
        description="Manage stock levels, dosage details, pricing, and categories."
      />
      <PageBreadcrumb
        items={[{ label: "Home", to: "/" }, { label: "Medicine Inventory" }]}
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-theme-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Total Items
            </span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">
              {totalItems}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-theme-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Out of Stock
            </span>
            <span className="text-2xl font-bold text-red-600 mt-1 block">
              {outOfStockCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-theme-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Low Stock (≤10)
            </span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">
              {lowStockCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5" />
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
              placeholder="Search medicine name, dosage..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-full sm:w-60"
            />
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0">
                CATEGORY:
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-700 bg-white cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={() => {
              setFormData({
                name: "",
                dosage: "",
                category: "General",
                stock: 0,
                price: 0,
                expiryDate: "",
                manufacturer: "",
              });
              setFormErrors({});
              setIsAddModalOpen(true);
            }}
            variant="primary"
            size="md"
            className="shrink-0"
          >
            Create Medicine
          </Button>
        </div>

        {/* Medicines Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <THead>
              <TR>
                <TH>#</TH>
                <TH>MEDICINE NAME</TH>
                <TH>DOSAGE</TH>
                <TH>CATEGORY</TH>
                <TH>STOCK LEVEL</TH>
                <TH>PRICE</TH>
                <TH>EXPIRY DATE</TH>
                <TH>MANUFACTURER</TH>
                <TH className="text-right">ACTIONS</TH>
              </TR>
            </THead>
            <TBody>
              {isLoading ? (
                <TR>
                  <TD
                    colSpan={9}
                    className="py-10 text-center text-gray-400 text-sm"
                  >
                    Loading medicine inventory...
                  </TD>
                </TR>
              ) : filteredMedicines.length === 0 ? (
                <TR>
                  <TD
                    colSpan={9}
                    className="py-10 text-center text-gray-400 text-sm"
                  >
                    No medicine items found.
                  </TD>
                </TR>
              ) : (
                filteredMedicines.map((med, idx) => {
                  const stockNum = Number(med.stock);
                  return (
                    <TR key={med._id}>
                      <TD className="text-sm text-gray-500">{idx + 1}</TD>
                      <TD className="text-sm font-semibold text-gray-900">
                        {med.name}
                      </TD>
                      <TD className="text-sm text-gray-600">
                        {med.dosage || "--"}
                      </TD>
                      <TD className="text-sm">
                        <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                          {med.category || "General"}
                        </span>
                      </TD>
                      <TD className="text-sm">
                        {stockNum === 0 ? (
                          <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Out of Stock
                          </span>
                        ) : stockNum <= 10 ? (
                          <span className="px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-bold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {stockNum} Low
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {stockNum} In Stock
                          </span>
                        )}
                      </TD>
                      <TD className="text-sm font-bold text-gray-900">
                        {Number(med.price).toFixed(2)}
                      </TD>
                      <TD className="text-sm text-gray-600">
                        {med.expiryDate || "--"}
                      </TD>
                      <TD className="text-sm text-gray-600">
                        {med.manufacturer || "--"}
                      </TD>
                      <TD className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(med)}
                            className="p-1 text-gray-400 hover:text-blue-600 focus:outline-none cursor-pointer"
                            title="Edit Medicine"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(med)}
                            className="p-1 text-gray-400 hover:text-red-600 focus:outline-none cursor-pointer"
                            title="Delete Medicine"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
        </div>
      </div>

      {/* Modal - Add Medicine */}
      <CustomModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Medicine"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Medicine Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Paracetamol"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
            {formErrors.name && (
              <p className="text-xs text-red-500 mt-1 font-bold">
                {formErrors.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Dosage
              </label>
              <input
                type="text"
                placeholder="e.g. 500mg"
                value={formData.dosage}
                onChange={(e) =>
                  setFormData({ ...formData, dosage: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="e.g. General"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Stock Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="100"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
              {formErrors.stock && (
                <p className="text-xs text-red-500 mt-1 font-bold">
                  {formErrors.stock}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Unit Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="15.00"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
              {formErrors.price && (
                <p className="text-xs text-red-500 mt-1 font-bold">
                  {formErrors.price}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData({ ...formData, expiryDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                placeholder="e.g. Pharma Inc."
                value={formData.manufacturer}
                onChange={(e) =>
                  setFormData({ ...formData, manufacturer: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Medicine
            </Button>
          </div>
        </form>
      </CustomModal>

      {/* Modal - Edit Medicine */}
      <CustomModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Medicine Details"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Medicine Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) =>
                setEditFormData({ ...editFormData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
            {formErrors.name && (
              <p className="text-xs text-red-500 mt-1 font-bold">
                {formErrors.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Dosage
              </label>
              <input
                type="text"
                value={editFormData.dosage}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, dosage: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={editFormData.category}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, category: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Stock Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={editFormData.stock}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, stock: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
              {formErrors.stock && (
                <p className="text-xs text-red-500 mt-1 font-bold">
                  {formErrors.stock}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Unit Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editFormData.price}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, price: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
              {formErrors.price && (
                <p className="text-xs text-red-500 mt-1 font-bold">
                  {formErrors.price}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={editFormData.expiryDate}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    expiryDate: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                value={editFormData.manufacturer}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    manufacturer: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Update Medicine
            </Button>
          </div>
        </form>
      </CustomModal>

      {/* Modal - Delete Medicine Confirmation */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Medicine Record"
        message={`Are you sure you want to delete '${selectedMedicine?.name}'? This action cannot be undone.`}
      />
    </div>
  );
}
