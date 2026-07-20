"use client";

import React, { useState, useEffect, useMemo } from "react";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import Button from "@/components/UI/Button";
import { CustomModal, DeleteConfirmModal } from "@/components/UI/Modal";
import { getBookings } from "@/config/AxiosConfig";
import { Toast } from "@/components/Toast";
import { format } from "date-fns";

export default function AppointmentsPage() {
  const [bookingsList, setBookingsList] = useState([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditStatusModalOpen, setIsEditStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  const [newBookingData, setNewBookingData] = useState({
    customerName: "",
    serviceName: "",
    date: "",
    time: "",
    amount: "",
  });

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await getBookings();
        if (res.status === 200 && res.data?.status === true) {
          setBookingsList(res.data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    return bookingsList.filter((b) => {
      const matchesSearch =
        b.customerName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        b.serviceName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        b.id.toLowerCase().includes(searchFilter.toLowerCase());

      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && b.date >= startDate;
      }
      if (endDate) {
        matchesDate = matchesDate && b.date <= endDate;
      }

      return matchesSearch && matchesDate;
    });
  }, [bookingsList, searchFilter, startDate, endDate]);

  const handleStatusUpdateClick = (booking) => {
    setSelectedBooking(booking);
    setNewStatus(booking.status);
    setIsEditStatusModalOpen(true);
  };

  const handleSaveStatus = () => {
    setBookingsList((prev) =>
      prev.map((b) => (b.id === selectedBooking.id ? { ...b, status: newStatus } : b))
    );
    setIsEditStatusModalOpen(false);
    Toast({ message: `Status updated for ${selectedBooking.id}`, type: "success" });
  };

  const handleDeleteClick = (booking) => {
    setSelectedBooking(booking);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    setBookingsList((prev) => prev.filter((b) => b.id !== selectedBooking.id));
    setIsDeleteModalOpen(false);
    Toast({ message: `${selectedBooking.id} deleted successfully`, type: "success" });
  };

  const handleAddBooking = (e) => {
    e.preventDefault();
    if (
      !newBookingData.customerName ||
      !newBookingData.serviceName ||
      !newBookingData.date ||
      !newBookingData.time ||
      !newBookingData.amount
    ) {
      Toast({ message: "Please fill all required fields", type: "error" });
      return;
    }

    const newBooking = {
      id: `B-${Math.floor(100 + Math.random() * 900)}`,
      customerName: newBookingData.customerName,
      serviceName: newBookingData.serviceName,
      date: newBookingData.date,
      time: newBookingData.time,
      status: "Confirmed",
      amount: Number(newBookingData.amount),
    };

    setBookingsList((prev) => [newBooking, ...prev]);
    setIsAddModalOpen(false);
    setNewBookingData({
      customerName: "",
      serviceName: "",
      date: "",
      time: "",
      amount: "",
    });
    Toast({ message: "Booking created successfully", type: "success" });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-50 text-green-700 border-green-200";
      case "Pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <>
      <PageMeta title="Appointments - Booking Admin" description="Manage user appointments" />
      <PageBreadcrumb
        items={[{ label: "Home", to: "/" }, { label: "Appointments", to: "/appointments" }]}
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
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
            <span className="text-gray-400 text-sm hidden md:inline">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
            Add Booking
          </Button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Booking ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-400 text-sm">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {b.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      {b.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {b.serviceName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="block font-medium">{b.date}</span>
                      <span className="text-xs text-gray-400">{b.time}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                      ₹{b.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        onClick={() => handleStatusUpdateClick(b)}
                        className={`inline-flex px-2.5 py-1 text-xs font-semibold border rounded-full cursor-pointer hover:opacity-85 transition-opacity ${getStatusClass(
                          b.status
                        )}`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleStatusUpdateClick(b)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Status
                      </button>
                      <button
                        onClick={() => handleDeleteClick(b)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Status Modal */}
      <CustomModal isOpen={isEditStatusModalOpen} onClose={() => setIsEditStatusModalOpen(false)}>
        <div className="w-full">
          <h4 className="mb-4 text-xl font-bold text-gray-800">Update Booking Status</h4>
          {selectedBooking && (
            <p className="mb-4 text-sm text-gray-500">
              Update booking status for <span className="font-semibold">{selectedBooking.id}</span>
            </p>
          )}
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="w-full mb-6 p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsEditStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveStatus}>
              Save Changes
            </Button>
          </div>
        </div>
      </CustomModal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        message="Are you sure you want to cancel and delete this booking? This action cannot be undone."
        itemName={selectedBooking ? selectedBooking.id : ""}
      />

      {/* Add Booking Modal */}
      <CustomModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
        <form onSubmit={handleAddBooking} className="space-y-4">
          <h4 className="text-xl font-bold text-gray-800 mb-2">Create New Booking</h4>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newBookingData.customerName}
              onChange={(e) =>
                setNewBookingData((prev) => ({ ...prev, customerName: e.target.value }))
              }
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Service <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newBookingData.serviceName}
              onChange={(e) =>
                setNewBookingData((prev) => ({ ...prev, serviceName: e.target.value }))
              }
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              placeholder="e.g. Haircut & Styling"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={newBookingData.date}
                onChange={(e) => setNewBookingData((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newBookingData.time}
                onChange={(e) => setNewBookingData((prev) => ({ ...prev, time: e.target.value }))}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. 10:00 AM"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Amount (INR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              value={newBookingData.amount}
              onChange={(e) => setNewBookingData((prev) => ({ ...prev, amount: e.target.value }))}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              placeholder="e.g. 1500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Booking
            </Button>
          </div>
        </form>
      </CustomModal>
    </>
  );
}
