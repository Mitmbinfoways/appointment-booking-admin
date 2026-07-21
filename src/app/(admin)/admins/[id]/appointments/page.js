"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { 
  getAdminFormConfigSuper, 
  getAdminBookingsSuperList, 
  getAdminsList,
  updateAdminBookingSuperRecord,
  deleteAdminBookingSuperRecord
} from "@/config/AxiosConfig";
import { Toast } from "@/components/Toast";
import { Table, THead, TBody, TR, TD, TH } from "@/components/UI/table";
import { CustomModal, DeleteConfirmModal } from "@/components/UI/Modal";
import { Eye, Pencil, Trash2 } from "lucide-react";
import Button from "@/components/UI/Button";

const getStatusClass = (status) => {
  switch (status) {
    case "confirmed":
    case "Confirmed":
      return "bg-green-50 text-green-700 border-green-200";
    case "pending":
    case "Pending":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "cancelled":
    case "Cancelled":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-55 text-gray-700 border-gray-200";
  }
};

export default function AdminAppointmentsPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const adminId = params.id;

  const [adminUser, setAdminUser] = useState(null);
  const [formFields, setFormFields] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const getNumericBookingId = (b) => {
    if (!b) return "";
    if (b.bookingId) return String(b.bookingId);
    const dateDigits = b.slotDate ? b.slotDate.replace(/-/g, "") : "";
    let suffix = "0000";
    if (b._id) {
      const hexPart = b._id.toString().slice(-6);
      const num = parseInt(hexPart, 16);
      if (!isNaN(num)) {
        suffix = String(num % 10000).padStart(4, "0");
      }
    }
    return dateDigits ? `${dateDigits}${suffix}` : suffix;
  };

  const formatDateDDMMYYYY = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (!isNaN(d.getTime()) && dateStr.includes("T")) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
    const parts = dateStr.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const formatBookedDate = (createdAt) => {
    if (!createdAt) return "";
    const d = new Date(createdAt);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Modals state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Edit form state
  const [editStatus, setEditStatus] = useState("confirmed");
  const [editResponses, setEditResponses] = useState({});

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Load Admin details
      const adminsRes = await getAdminsList();
      if (adminsRes.status === 200 && adminsRes.data?.statusCode === 200) {
        const list = adminsRes.data.data || [];
        const found = list.find(a => a._id === adminId);
        if (found) setAdminUser(found);
      }

      // 2. Load FormConfig
      const formRes = await getAdminFormConfigSuper(adminId);
      if (formRes.status === 200 && formRes.data?.statusCode === 200) {
        setFormFields(formRes.data.data?.fields || []);
      }

      // 3. Load Bookings
      const bookingsRes = await getAdminBookingsSuperList(adminId);
      if (bookingsRes.status === 200 && bookingsRes.data?.statusCode === 200) {
        setBookingsList(bookingsRes.data.data?.bookings || []);
      }
    } catch (err) {
      console.error(err);
      Toast({ message: "Error loading bookings information.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [adminId]);

  // Columns classification
  const mediaFields = useMemo(() => {
    return formFields.filter(f => f.inputType === "image" || f.inputType === "video");
  }, [formFields]);

  const regularFields = useMemo(() => {
    return formFields.filter(f => f.inputType !== "image" && f.inputType !== "video");
  }, [formFields]);

  const filteredBookings = useMemo(() => {
    return bookingsList.filter((b) => {
      // Search filter across dynamic response values
      const responsesString = formFields
        .map(f => String(b.dynamicResponses?.[f.fieldKey] || b.dynamicResponses?.get?.(f.fieldKey) || ""))
        .join(" ")
        .toLowerCase();

      const matchesSearch = !searchFilter ||
        responsesString.includes(searchFilter.toLowerCase()) ||
        b._id.toLowerCase().includes(searchFilter.toLowerCase());

      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && b.slotDate >= startDate;
      }
      if (endDate) {
        matchesDate = matchesDate && b.slotDate <= endDate;
      }

      let matchesStatus = true;
      if (statusFilter) {
        matchesStatus = b.status?.toLowerCase() === statusFilter.toLowerCase();
      }

      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [bookingsList, formFields, searchFilter, startDate, endDate, statusFilter]);

  // Action Triggers
  const handleViewClick = (booking) => {
    setSelectedBooking(booking);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (booking) => {
    setSelectedBooking(booking);
    setEditStatus(booking.status || "confirmed");
    const responses = {};
    formFields.forEach(f => {
      const val = booking.dynamicResponses?.[f.fieldKey] || booking.dynamicResponses?.get?.(f.fieldKey);
      responses[f.fieldKey] = val !== undefined && val !== null ? val : "";
    });
    setEditResponses(responses);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (booking) => {
    setSelectedBooking(booking);
    setIsDeleteModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updateAdminBookingSuperRecord(selectedBooking._id, {
        status: editStatus,
        dynamicResponses: editResponses
      });
      if (res.status === 200) {
        Toast({ message: "Booking updated successfully.", type: "success" });
        setIsEditModalOpen(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
      Toast({ message: "Failed to update booking.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsSaving(true);
    try {
      const res = await deleteAdminBookingSuperRecord(selectedBooking._id);
      if (res.status === 200) {
        Toast({ message: "Booking deleted successfully.", type: "success" });
        setIsDeleteModalOpen(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
      Toast({ message: "Failed to delete booking.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditResponseChange = (fieldKey, value) => {
    setEditResponses(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  return (
    <>
      <PageMeta 
        title={`Appointments - ${adminUser?.username || "Admin"} - Booking Admin`} 
        description="View and manage sub-admin appointments" 
      />
      <PageBreadcrumb
        items={[
          { label: "Home", to: "/" }, 
          { label: "Admins Management", to: "/admins" },
          { label: `Bookings (${adminUser?.username || "Admin"})`, to: `/admins/${adminId}/appointments` }
        ]}
      />

      <div className="bg-white rounded-lg border border-gray-200 shadow-theme-xs">
        {/* Header Section */}
        <div className="flex flex-col gap-4 p-4 border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search appointments..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-full sm:w-60"
            />
            {/* Date Filters */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-700"
            />
            <span className="text-gray-500 text-sm hidden sm:inline">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-700"
            />
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-700 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <THead>
              <TR>
                <TH>SR NO</TH>
                {/* Dynamically render Media Columns (Image / Video) first */}
                {mediaFields.map((field) => (
                  <TH key={field.fieldKey}>{field.label}</TH>
                ))}
                <TH>Booking ID</TH>
                {/* Dynamically render Regular Form Columns */}
                {regularFields.map((field) => (
                  <TH key={field.fieldKey}>{field.label}</TH>
                ))}
                <TH>Appointment Date & Time</TH>
                <TH>Date</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {isLoading ? (
                <TR>
                  <TD colSpan={5 + formFields.length} className="px-6 py-10 text-center text-gray-400 text-sm">
                    Loading bookings...
                  </TD>
                </TR>
              ) : filteredBookings.length === 0 ? (
                <TR>
                  <TD colSpan={5 + formFields.length} className="px-6 py-10 text-center text-gray-400 text-sm">
                    No bookings found.
                  </TD>
                </TR>
              ) : (
                filteredBookings.map((b, idx) => (
                  <TR key={b._id}>
                    <TD className="text-sm text-gray-500">{idx + 1}</TD>
                    
                    {/* Render matching dynamic responses for Media Columns */}
                    {mediaFields.map((field) => {
                      const val = b.dynamicResponses?.[field.fieldKey] || b.dynamicResponses?.get?.(field.fieldKey);
                      return (
                        <TD key={field.fieldKey} className="text-sm">
                          {val ? (
                            field.inputType === "image" ? (
                              <img 
                                src={val} 
                                alt={field.label} 
                                className="w-10 h-10 object-cover rounded-lg border border-gray-200" 
                              />
                            ) : (
                              <video 
                                src={val} 
                                className="w-14 h-10 object-cover rounded-lg border border-gray-200" 
                                controls 
                              />
                            )
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TD>
                      );
                    })}

                    <TD className="text-sm font-semibold text-gray-900">
                      {getNumericBookingId(b)}
                    </TD>

                    {/* Render matching dynamic responses for Regular Form Columns */}
                    {regularFields.map((field) => {
                      const val = b.dynamicResponses?.[field.fieldKey] || b.dynamicResponses?.get?.(field.fieldKey);
                      return (
                        <TD key={field.fieldKey} className="text-sm text-gray-700">
                          {val !== undefined && val !== null ? String(val) : "-"}
                        </TD>
                      );
                    })}

                    <TD className="text-gray-600 text-sm">
                      <span className="block font-semibold text-gray-900">{formatDateDDMMYYYY(b.slotDate)}</span>
                      <span className="block text-xs text-gray-500">{b.slotStartTime} - {b.slotEndTime}</span>
                    </TD>
                    <TD className="text-sm font-medium text-gray-700">
                      {formatBookedDate(b.createdAt) || formatDateDDMMYYYY(b.slotDate)}
                    </TD>
                    <TD>
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-semibold border rounded-full ${getStatusClass(
                          b.status
                        )}`}
                      >
                        {b.status}
                      </span>
                    </TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-3.5">
                        <button
                          onClick={() => handleViewClick(b)}
                          title="View Details"
                          className="text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEditClick(b)}
                          title="Edit Booking"
                          className="text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(b)}
                          title="Delete Booking"
                          className="text-gray-500 hover:text-red-650 transition-colors cursor-pointer"
                        >
                          <Trash2 size={18} />
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

      {/* View Modal */}
      <CustomModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="View Booking Details"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
              <div>
                <span className="block text-[10px] uppercase font-bold text-gray-400">Booking ID</span>
                <span className="text-sm font-semibold text-gray-900">{getNumericBookingId(selectedBooking)}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-gray-400">Status</span>
                <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold border rounded-full ${getStatusClass(selectedBooking.status)}`}>
                  {selectedBooking.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-3">
              <div>
                <span className="block text-[10px] uppercase font-bold text-gray-400">Appointment Date</span>
                <span className="text-sm font-medium text-gray-800">{formatDateDDMMYYYY(selectedBooking.slotDate)}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-gray-400">Time Window</span>
                <span className="text-sm font-medium text-gray-800">{selectedBooking.slotStartTime} - {selectedBooking.slotEndTime}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-gray-400">Booking Date</span>
                <span className="text-sm font-medium text-blue-600">{formatBookedDate(selectedBooking.createdAt) || formatDateDDMMYYYY(selectedBooking.slotDate)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <span className="block text-xs font-bold text-gray-500 border-b pb-1">Response Data</span>
              {formFields.map((field) => {
                const val = selectedBooking.dynamicResponses?.[field.fieldKey] || selectedBooking.dynamicResponses?.get?.(field.fieldKey);
                return (
                  <div key={field.fieldKey} className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-gray-400">{field.label}</span>
                    <div className="text-sm text-gray-800">
                      {val ? (
                        field.inputType === "image" ? (
                          <a href={val} target="_blank" rel="noreferrer" className="block max-w-xs border rounded-lg overflow-hidden hover:opacity-90">
                            <img src={val} alt={field.label} className="w-full object-cover max-h-40" />
                          </a>
                        ) : field.inputType === "video" ? (
                          <video src={val} className="max-w-xs border rounded-lg max-h-40" controls />
                        ) : (
                          <span>{String(val)}</span>
                        )
                      ) : (
                        <span className="text-gray-400 italic">No response provided</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3">
              <Button onClick={() => setIsViewModalOpen(false)} variant="secondary">
                Close
              </Button>
            </div>
          </div>
        )}
      </CustomModal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Booking"
        message="Are you sure you want to permanently delete this booking? This action cannot be undone."
      />
    </>
  );
}
