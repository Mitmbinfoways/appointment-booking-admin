"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { 
  getAdminFormConfig, 
  getBookings, 
  updateAdminBookingRecord, 
  deleteAdminBookingRecord,
  getAvailableSlotsList,
  createBookingRecord,
  getHolidaysList,
  getAdminSlotSettings
} from "@/config/AxiosConfig";
import { Toast } from "@/components/Toast";
import { Table, THead, TBody, TR, TD, TH } from "@/components/UI/table";
import { CustomModal, DeleteConfirmModal } from "@/components/UI/Modal";
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
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

export default function AppointmentsPage() {
  const adminState = useSelector((state) => state.admin) || {};
  const { admin } = adminState;
  const fetchedRef = useRef(false);

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Edit form state
  const [editStatus, setEditStatus] = useState("confirmed");
  const [editResponses, setEditResponses] = useState({});

  // Create form state
  const [newBookingDate, setNewBookingDate] = useState("");
  const [newBookingSlot, setNewBookingSlot] = useState("");
  const [newBookingResponses, setNewBookingResponses] = useState({});
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Calendar Selection State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState([]);
  const [slotSettings, setSlotSettings] = useState(null);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = [2025, 2026, 2027, 2028, 2029, 2030];

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => (years.includes(prev - 1) ? prev - 1 : prev));
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => (years.includes(prev + 1) ? prev + 1 : prev));
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const todayStr = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }, []);

  // Fetch holidays & slotSettings when entering manual creation flow
  useEffect(() => {
    const loadConfigForCalendar = async () => {
      if (!isCreateModalOpen) return;
      try {
        const holidaysRes = await getHolidaysList();
        if (holidaysRes.status === 200 && holidaysRes.data?.statusCode === 200) {
          setHolidays(holidaysRes.data.data || []);
        }
        const slotsRes = await getAdminSlotSettings();
        if (slotsRes.status === 200 && slotsRes.data?.statusCode === 200) {
          setSlotSettings(slotsRes.data.data);
        }
      } catch (err) {
        console.error("Error loading config for calendar selection:", err);
      }
    };
    loadConfigForCalendar();
  }, [isCreateModalOpen]);

  // Generate calendar days for selectedMonth and selectedYear
  const calendarDays = useMemo(() => {
    const startDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const days = [];

    // Add empty slots for days of previous month
    for (let i = 0; i < startDay; i++) {
      days.push({ day: null, dateStr: null });
    }

    // Add days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const currentDateObj = new Date(selectedYear, selectedMonth, d);
      const yearStr = selectedYear;
      const monthStr = String(selectedMonth + 1).padStart(2, "0");
      const dayStr = String(d).padStart(2, "0");
      const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

      const weekdayName = currentDateObj.toLocaleDateString("en-US", { weekday: "long" });
      
      let isClosedDay = false;
      if (slotSettings && slotSettings.workingDays) {
        const dayConfig = slotSettings.workingDays.find((wd) => wd.day === weekdayName);
        if (dayConfig && !dayConfig.isOpen) {
          isClosedDay = true;
        }
      }

      const formattedDdMmYyyy = `${dayStr}-${monthStr}-${yearStr}`;
      const holiday = holidays.find((h) => h.date === dateStr || h.date === formattedDdMmYyyy);
      const isPastDay = dateStr < todayStr;
      const isFullDayHoliday = holiday && (holiday.holidayType === "full" || holiday.holidayType === undefined || holiday.holidayType === null || holiday.isFullDay === true);

      days.push({
        day: d,
        dateStr,
        isClosedDay,
        isPastDay,
        isHoliday: !!holiday,
        isFullDayHoliday: !!isFullDayHoliday,
        holidayTitle: holiday ? holiday.reason || holiday.title : null
      });
    }

    return days;
  }, [selectedYear, selectedMonth, holidays, slotSettings]);

  const handleCreateClick = () => {
    setSelectedBooking(null);
    setNewBookingDate("");
    setNewBookingSlot("");
    const initialResponses = {};
    formFields.forEach(f => {
      initialResponses[f.fieldKey] = "";
    });
    setNewBookingResponses(initialResponses);
    setAvailableSlots([]);
    setIsCreateModalOpen(true);
  };

  const handleNewResponseChange = (fieldKey, value) => {
    setNewBookingResponses(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const loadData = async (force = false) => {
    if (!force && fetchedRef.current) return;
    fetchedRef.current = true;
    setIsLoading(true);
    try {
      // 1. Load FormConfig
      const formRes = await getAdminFormConfig();
      if (formRes.status === 200 && formRes.data?.statusCode === 200) {
        setFormFields(formRes.data.data?.fields || []);
      }

      // 2. Load Bookings
      const bookingsRes = await getBookings();
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
    loadData(false);
  }, []);

  useEffect(() => {
    const loadSlots = async () => {
      if (!newBookingDate || !admin?._id) return;
      setIsLoadingSlots(true);
      try {
        const res = await getAvailableSlotsList(admin._id, newBookingDate);
        if (res.status === 200 && res.data?.statusCode === 200) {
          setAvailableSlots(res.data.data || []);
        } else {
          setAvailableSlots([]);
        }
      } catch (err) {
        console.error("Error loading available slots:", err);
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    loadSlots();
  }, [newBookingDate, admin?._id]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newBookingDate) {
      Toast({ message: "Please select a date.", type: "error" });
      return;
    }
    if (!newBookingSlot) {
      Toast({ message: "Please select a time slot.", type: "error" });
      return;
    }

    let missingField = null;
    formFields.forEach(f => {
      if (f.required && !newBookingResponses[f.fieldKey]) {
        missingField = f.label;
      }
    });

    if (missingField) {
      Toast({ message: `Field "${missingField}" is required.`, type: "error" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const f of formFields) {
      const isEmail = f.type === "email" || f.label?.toLowerCase().includes("email");
      const val = newBookingResponses[f.fieldKey];
      if (isEmail && val && !emailRegex.test(String(val).trim())) {
        Toast({ message: `Please enter a valid email address for "${f.label}".`, type: "error" });
        return;
      }
    }

    const [startTime, endTime] = newBookingSlot.split("-");
    setIsSaving(true);

    try {
      let res;
      if (selectedBooking) {
        res = await updateAdminBookingRecord(selectedBooking._id, {
          slotDate: newBookingDate,
          slotStartTime: startTime,
          slotEndTime: endTime,
          status: editStatus,
          dynamicResponses: newBookingResponses
        });
      } else {
        res = await createBookingRecord(admin._id, {
          slotDate: newBookingDate,
          slotStartTime: startTime,
          slotEndTime: endTime,
          dynamicResponses: newBookingResponses
        });
      }

      if (res.status === 201 || res.status === 200) {
        Toast({ message: selectedBooking ? "Appointment updated successfully." : "Appointment created successfully.", type: "success" });
        setIsCreateModalOpen(false);
        setSelectedBooking(null);
        loadData(true);
      } else {
        Toast({ message: res.data?.message || "Failed to save booking.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      const errMsg = err?.response?.data?.message || "Failed to save appointment.";
      Toast({ message: errMsg, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Columns classification
  const mediaFields = useMemo(() => {
    return formFields.filter(f => f.type === "image" || f.type === "video");
  }, [formFields]);

  const regularFields = useMemo(() => {
    return formFields.filter(f => f.type !== "image" && f.type !== "video");
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
    setNewBookingDate(booking.slotDate || "");
    setNewBookingSlot(`${booking.slotStartTime}-${booking.slotEndTime}`);

    if (booking.slotDate) {
      const parts = booking.slotDate.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          setSelectedYear(y);
          setSelectedMonth(m);
        }
      }
    }

    const responses = {};
    formFields.forEach(f => {
      const val = booking.dynamicResponses?.[f.fieldKey] || booking.dynamicResponses?.get?.(f.fieldKey);
      responses[f.fieldKey] = val !== undefined && val !== null ? val : "";
    });
    setNewBookingResponses(responses);
    setIsCreateModalOpen(true);
  };

  const handleDeleteClick = (booking) => {
    setSelectedBooking(booking);
    setIsDeleteModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updateAdminBookingRecord(selectedBooking._id, {
        status: editStatus,
        dynamicResponses: editResponses
      });
      if (res.status === 200) {
        Toast({ message: "Booking updated successfully.", type: "success" });
        setIsEditModalOpen(false);
        loadData(true);
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
      const res = await deleteAdminBookingRecord(selectedBooking._id);
      if (res.status === 200) {
        Toast({ message: "Booking deleted successfully.", type: "success" });
        setIsDeleteModalOpen(false);
        loadData(true);
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

  if (isCreateModalOpen) {
    return (
      <>
        <PageMeta title={`${selectedBooking ? "Edit" : "Create"} Appointment - Booking Admin`} description={`${selectedBooking ? "Edit" : "Create"} user appointment`} />
        <PageBreadcrumb
          items={[
            { label: "Home", to: "/" },
            { label: "Appointments", to: "/appointments" },
            { label: selectedBooking ? "Edit Appointment" : "Create Appointment", to: "" }
          ]}
        />

        <div className="bg-white rounded-lg border border-gray-200 shadow-theme-xs w-full">
          <div className="p-4 border-b border-gray-200 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900">{selectedBooking ? "Edit Appointment Details" : "Create Appointment Manually"}</h3>
            <p className="text-sm text-gray-500">{selectedBooking ? "Update appointment date, time window, status, and response details below." : "First select an available date on the calendar, then fill the details."}</p>
          </div>

          <form onSubmit={handleCreateSubmit} className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start w-full">
              {/* Left Column: Calendar Date Selection */}
              <div className="w-full space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Select Date <span className="text-red-500">*</span>
                </label>

                <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-theme-xs">
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500 bg-white"
                      >
                        {years.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>

                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          className="p-2 hover:bg-gray-50 border-r border-gray-300 transition-colors"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span className="px-3 py-1.5 text-xs font-bold text-gray-700 min-w-28 text-center select-none">
                          {months[selectedMonth]}
                        </span>
                        <button
                          type="button"
                          onClick={handleNextMonth}
                          className="p-2 hover:bg-gray-50 border-l border-gray-300 transition-colors"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>

                    {newBookingDate && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewBookingDate("");
                          setNewBookingSlot("");
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center mb-1 font-semibold text-gray-400 text-[10px] uppercase tracking-wider">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((dayObj, idx) => {
                      if (!dayObj.day) {
                        return <div key={`empty-${idx}`} className="aspect-square bg-gray-55/50 rounded-lg border border-transparent"></div>;
                      }

                      const isSelected = newBookingDate === dayObj.dateStr;
                      const isClosed = dayObj.isClosedDay;
                      const isPast = dayObj.isPastDay;
                      const isHoliday = dayObj.isHoliday;
                      const isFullDayHoliday = dayObj.isFullDayHoliday;
                      const isToday = dayObj.dateStr === todayStr;

                      return (
                        <div
                          key={dayObj.dateStr}
                          onClick={() => {
                            if (isClosed || isFullDayHoliday || isPast) return;
                            setNewBookingDate(dayObj.dateStr);
                            setNewBookingSlot("");
                          }}
                          className={`aspect-square rounded-lg flex items-center justify-center text-xs transition-all duration-200 select-none border relative
                            ${isClosed || isPast
                              ? "bg-gray-100/70 text-gray-400 border-gray-200 cursor-not-allowed"
                              : isFullDayHoliday
                                ? "bg-red-50 text-red-700 border-red-200 cursor-not-allowed"
                                : isSelected
                                  ? "bg-blue-600 text-white border-blue-600 font-semibold cursor-pointer"
                                  : isToday
                                    ? "bg-green-50 text-green-700 border-green-300 font-bold cursor-pointer"
                                    : "bg-white text-gray-800 hover:border-blue-600 border-gray-200 cursor-pointer"
                            }
                          `}
                          title={
                            isPast
                              ? "Past Date (Cannot book in the past)"
                              : isClosed
                                ? "Closed Day (Normal Off-Day)"
                                : isHoliday
                                  ? `Holiday: ${dayObj.holidayTitle || "Holiday"}`
                                  : `Select Date: ${dayObj.dateStr}`
                          }
                        >
                          <div className="flex flex-col items-center justify-center">
                            <span>{dayObj.day}</span>
                            {isPast && <span className="text-[7px] text-gray-400 uppercase leading-none mt-0.5">Past</span>}
                            {!isPast && isClosed && <span className="text-[7px] text-gray-400 uppercase leading-none mt-0.5">Off</span>}
                            {!isPast && isFullDayHoliday && <span className="text-[7px] text-red-500 uppercase leading-none mt-0.5">Hol</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Time Slot Selector & Dynamic Inputs */}
              <div className="w-full">
                {newBookingDate ? (
                  <div className="space-y-6 animate-fadeIn">
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-1">
                        Details for {newBookingDate}
                      </h4>
                      <p className="text-xs text-gray-500">Choose an available slot and populate form fields below.</p>
                    </div>

                    <div className="border-t border-gray-100 pt-5">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Select Time Slot <span className="text-red-500">*</span>
                      </label>
                      {isLoadingSlots ? (
                        <p className="text-xs text-gray-400">Loading available slots...</p>
                      ) : (availableSlots.length === 0 && !selectedBooking) ? (
                        <p className="text-xs text-red-500 font-medium">No slots available for {newBookingDate}.</p>
                      ) : (
                        <select
                          value={newBookingSlot}
                          required
                          onChange={(e) => setNewBookingSlot(e.target.value)}
                          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:border-blue-500"
                        >
                          <option value="">-- Select a Slot --</option>
                          {(() => {
                            const renderedSlots = [...availableSlots];
                            if (selectedBooking && selectedBooking.slotStartTime && selectedBooking.slotEndTime) {
                              const currentSlotKey = `${selectedBooking.slotStartTime}-${selectedBooking.slotEndTime}`;
                              const exists = renderedSlots.some(s => `${s.startTime}-${s.endTime}` === currentSlotKey);
                              if (!exists) {
                                renderedSlots.unshift({
                                  startTime: selectedBooking.slotStartTime,
                                  endTime: selectedBooking.slotEndTime,
                                  status: "available"
                                });
                              }
                            }
                            return renderedSlots.map((s) => {
                              const isCurrentSlot = selectedBooking && `${s.startTime}-${s.endTime}` === `${selectedBooking.slotStartTime}-${selectedBooking.slotEndTime}`;
                              const isAvailable = s.status === "available" || isCurrentSlot;
                              const isBooked = s.status === "booked" && !isCurrentSlot;
                              const isBreak = s.status === "break";

                              let label = `${s.startTime} - ${s.endTime}`;
                              if (isCurrentSlot) label += " (Current Slot)";
                              else if (isBooked) label += " (Already Booked)";
                              else if (isBreak) label += " (Break Slot)";

                              return (
                                <option
                                  key={`${s.startTime}-${s.endTime}`}
                                  value={isAvailable ? `${s.startTime}-${s.endTime}` : ""}
                                  disabled={!isAvailable}
                                  className={!isAvailable ? "text-gray-400 bg-gray-100 font-normal" : ""}
                                >
                                  {label}
                                </option>
                              );
                            });
                          })()}
                        </select>
                      )}
                    </div>

                    <div className="space-y-4 border-t border-gray-100 pt-5">
                      <span className="block text-sm font-bold text-gray-550 border-b pb-1.5">Response Fields</span>
                      {formFields.map((field) => {
                        const val = newBookingResponses[field.fieldKey] || "";
                        const isEmail = field.type === "email" || field.label?.toLowerCase().includes("email");
                        const isNumeric = field.type === "tel" || field.type === "number" || field.label?.toLowerCase().includes("phone") || field.label?.toLowerCase().includes("tel");

                        return (
                          <div key={field.fieldKey}>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            {field.type === "select" ? (
                              <select
                                value={val}
                                required={field.required}
                                onChange={(e) => handleNewResponseChange(field.fieldKey, e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:border-blue-500"
                              >
                                <option value="">Select option</option>
                                {(field.options || []).map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : field.type === "textarea" ? (
                              <textarea
                                value={val}
                                required={field.required}
                                onChange={(e) => handleNewResponseChange(field.fieldKey, e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:border-blue-500 min-h-20"
                              />
                            ) : (
                              <input
                                type={isNumeric ? "tel" : isEmail ? "email" : field.type === "number" ? "number" : "text"}
                                value={val}
                                required={field.required}
                                onChange={(e) => {
                                  let inputVal = e.target.value;
                                  if (isNumeric) {
                                    inputVal = inputVal.replace(/\D/g, "");
                                  }
                                  handleNewResponseChange(field.fieldKey, inputVal);
                                }}
                                onKeyDown={(e) => {
                                  if (isNumeric) {
                                    const allowedKeys = ["Backspace", "Tab", "Delete", "ArrowLeft", "ArrowRight", "Enter"];
                                    if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                                      e.preventDefault();
                                    }
                                  }
                                }}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:border-blue-500"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {selectedBooking && (
                      <div className="border-t border-gray-100 pt-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Status <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:border-blue-500 font-semibold"
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="pending">Pending</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                      <Button type="button" onClick={() => { setIsCreateModalOpen(false); setSelectedBooking(null); }} variant="secondary">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSaving || !newBookingSlot}>
                        {isSaving ? "Saving..." : selectedBooking ? "Save Changes" : "Create Appointment"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full justify-between min-h-[300px] border border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <div className="my-auto space-y-2">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h5 className="text-sm font-semibold text-gray-700">No Date Selected</h5>
                      <p className="text-xs text-gray-400 max-w-xs mx-auto">Please choose an open day on the calendar grid to configure your new appointment slot.</p>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-100 w-full shrink-0">
                      <Button type="button" onClick={() => setIsCreateModalOpen(false)} variant="secondary">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </>
    );
  }

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
          <Button onClick={handleCreateClick} variant="primary" size="md" className="shrink-0">
            Create Appointment
          </Button>
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
                            field.type === "image" ? (
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
                        field.type === "image" ? (
                          <a href={val} target="_blank" rel="noreferrer" className="block max-w-xs border rounded-lg overflow-hidden hover:opacity-90">
                            <img src={val} alt={field.label} className="w-full object-cover max-h-40" />
                          </a>
                        ) : field.type === "video" ? (
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
