"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { format, parseISO, isBefore, isEqual, startOfDay } from "date-fns";
import {
  getAdminFormConfigSuper,
  getAvailableSlotsList,
  updateAdminBookingSuperRecord,
  getAdminHolidaysSuperList,
  getAdminSlotSettingsSuper,
  getAdminsList,
  getAdminBookingsSuperList,
} from "@/config/AxiosConfig";
import { Toast } from "@/components/Toast";
import Button from "@/components/UI/Button";
import Tooltip from "@/components/UI/Tooltip";
import FileViewModal from "@/components/UI/FileViewModal";
import MultiSelectDropdown from "@/components/UI/MultiSelectDropdown";

export default function EditAdminAppointmentPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const adminId = params.id;
  const bookingId = params.bookingId;
  const router = useRouter();

  const [filePreview, setFilePreview] = useState({
    isOpen: false,
    url: "",
    type: "image",
    title: "",
  });

  const [adminUser, setAdminUser] = useState(null);
  const [formFields, setFormFields] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editStatus, setEditStatus] = useState("confirmed");
  const [editResponses, setEditResponses] = useState({});
  const [newBookingDate, setNewBookingDate] = useState("");
  const [newBookingSlot, setNewBookingSlot] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Calendar Selection State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState([]);
  const [slotSettings, setSlotSettings] = useState(null);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
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

  // Fetch configs, admin info and booking details
  useEffect(() => {
    const loadAllDetails = async () => {
      if (!adminId || !bookingId) return;
      setIsLoading(true);
      try {
        // 1. Get Admin Details
        const adminsRes = await getAdminsList();
        if (adminsRes.status === 200 && adminsRes.data?.statusCode === 200) {
          const list = adminsRes.data.data || [];
          const found = list.find((a) => a._id === adminId);
          if (found) setAdminUser(found);
        }

        // 2. Load Booking Details
        const bookingsRes = await getAdminBookingsSuperList(adminId);
        let currentBooking = null;
        if (
          bookingsRes.status === 200 &&
          bookingsRes.data?.statusCode === 200
        ) {
          const list = bookingsRes.data.data?.bookings || [];
          currentBooking = list.find((b) => b._id === bookingId);
          if (currentBooking) {
            setSelectedBooking(currentBooking);
            setEditStatus(currentBooking.status || "confirmed");
            setNewBookingDate(currentBooking.slotDate || "");
            setNewBookingSlot(
              `${currentBooking.slotStartTime}-${currentBooking.slotEndTime}`,
            );

            if (currentBooking.slotDate) {
              const parts = currentBooking.slotDate.split("-");
              if (parts.length === 3) {
                const y = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10) - 1;
                if (!isNaN(y) && !isNaN(m)) {
                  setSelectedYear(y);
                  setSelectedMonth(m);
                }
              }
            }
          }
        }

        // 3. Load Form config
        const formRes = await getAdminFormConfigSuper(adminId);
        if (formRes.status === 200 && formRes.data?.statusCode === 200) {
          const fields = formRes.data.data?.fields || [];
          setFormFields(fields);

          if (currentBooking) {
            const responses = {};
            fields.forEach((f) => {
              const val =
                currentBooking.dynamicResponses?.[f.fieldKey] ||
                currentBooking.dynamicResponses?.get?.(f.fieldKey);
              responses[f.fieldKey] =
                val !== undefined && val !== null ? val : "";
            });
            setEditResponses(responses);
          }
        }

        // 4. Load Holidays list
        const holidaysRes = await getAdminHolidaysSuperList(adminId);
        if (
          holidaysRes.status === 200 &&
          holidaysRes.data?.statusCode === 200
        ) {
          setHolidays(holidaysRes.data.data || []);
        }

        // 5. Load Slot Settings
        const slotsRes = await getAdminSlotSettingsSuper(adminId);
        if (slotsRes.status === 200 && slotsRes.data?.statusCode === 200) {
          setSlotSettings(slotsRes.data.data);
        }
      } catch (err) {
        console.error("Error loading edit page configurations:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAllDetails();
  }, [adminId, bookingId]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const startDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push({ day: null, dateStr: null });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const currentDateObj = new Date(selectedYear, selectedMonth, d);
      const yearStr = selectedYear;
      const monthStr = String(selectedMonth + 1).padStart(2, "0");
      const dayStr = String(d).padStart(2, "0");
      const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

      const weekdayName = currentDateObj.toLocaleDateString("en-US", {
        weekday: "long",
      });

      let isClosedDay = false;
      if (slotSettings && slotSettings.workingDays) {
        const dayConfig = slotSettings.workingDays.find(
          (wd) => wd.day === weekdayName,
        );
        if (dayConfig && !dayConfig.isOpen) {
          isClosedDay = true;
        }
      }

      const formattedDdMmYyyy = `${dayStr}-${monthStr}-${yearStr}`;
      const holiday = holidays.find(
        (h) => h.date === dateStr || h.date === formattedDdMmYyyy,
      );
      const isPastDay = dateStr < todayStr;
      const isFullDayHoliday =
        holiday &&
        (holiday.holidayType === "full" ||
          holiday.holidayType === undefined ||
          holiday.holidayType === null ||
          holiday.isFullDay === true);

      days.push({
        day: d,
        dateStr,
        isClosedDay,
        isPastDay,
        isHoliday: !!holiday,
        isFullDayHoliday: !!isFullDayHoliday,
        holidayTitle: holiday ? holiday.reason || holiday.title : null,
      });
    }

    return days;
  }, [selectedYear, selectedMonth, holidays, slotSettings]);

  const [minAdvanceNoticeMinutes, setMinAdvanceNoticeMinutes] = useState(0);

  // Load available slots when date changes
  useEffect(() => {
    const loadSlots = async () => {
      if (!newBookingDate || !adminId) return;
      setIsLoadingSlots(true);
      try {
        const res = await getAvailableSlotsList(adminId, newBookingDate);
        if (res.status === 200 && res.data?.statusCode === 200) {
          const rawData = res.data.data;
          const slotsList = Array.isArray(rawData)
            ? rawData
            : rawData?.slots || [];
          setMinAdvanceNoticeMinutes(rawData?.minAdvanceNoticeMinutes || 0);
          setAvailableSlots(slotsList);
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
  }, [newBookingDate, adminId]);

  const [fileNames, setFileNames] = useState({});

  const handleEditResponseChange = (fieldKey, value) => {
    setEditResponses((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
    if (fieldErrors[fieldKey]) {
      setFieldErrors((prev) => ({ ...prev, [fieldKey]: null }));
    }
  };

  const getFileNameDisplay = (val, fieldKey, defaultLabel) => {
    if (fileNames[fieldKey]) return fileNames[fieldKey];
    if (!val || typeof val !== "string") return "";
    if (val.includes("/") || val.includes("\\")) {
      const name = val.split(/[/\\]/).pop().split("?")[0];
      if (name && name.includes(".")) return name;
    }
    if (val.startsWith("data:")) {
      const match = val.match(/^data:(image|video)\/([a-zA-Z0-9]+);/);
      if (match) return `${match[1]}_file.${match[2]}`;
    }
    return defaultLabel;
  };

  const handleFileChange = (fieldKey, file, fieldType, event = null) => {
    if (!file) return;

    const clearFileInput = () => {
      setFileNames((prev) => ({ ...prev, [fieldKey]: "" }));
      handleEditResponseChange(fieldKey, "");
      if (event?.target) {
        event.target.value = "";
      }
      const inputEl = document.getElementById(`file_input_${fieldKey}`);
      if (inputEl) {
        inputEl.value = "";
      }
    };

    if (fieldType === "image" && !file.type.startsWith("image/")) {
      clearFileInput();
      Toast({ message: "Please select a valid image file.", type: "error" });
      return;
    }
    if (fieldType === "video" && !file.type.startsWith("video/")) {
      clearFileInput();
      Toast({ message: "Please select a valid video file.", type: "error" });
      return;
    }

    const maxSize = fieldType === "image" ? 5 * 1024 * 1024 : 20 * 1024 * 1024;
    const maxLabel = fieldType === "image" ? "5MB" : "20MB";
    if (file.size > maxSize) {
      clearFileInput();
      Toast({
        message: `File size must be less than ${maxLabel}.`,
        type: "error",
      });
      return;
    }

    if (file.name) {
      setFileNames((prev) => ({ ...prev, [fieldKey]: file.name }));
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleEditResponseChange(fieldKey, reader.result);
    };
    reader.onerror = () => {
      clearFileInput();
      Toast({ message: "Failed to read file.", type: "error" });
    };
    reader.readAsDataURL(file);
  };

  const validateDynamicResponses = () => {
    const newErrors = {};
    let firstErrorKey = null;

    if (!newBookingSlot) {
      newErrors.slot = "Time slot is required";
      if (!firstErrorKey) firstErrorKey = "slot";
    }

    formFields.forEach((field) => {
      const fieldKey = field.fieldKey || field.name || field.label;
      const rawVal = editResponses[fieldKey];
      const val =
        rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : "";

      const isEmail =
        field.type === "email" || field.label?.toLowerCase().includes("email");
      const isNumeric =
        field.type === "tel" ||
        field.type === "number" ||
        field.label?.toLowerCase().includes("phone") ||
        field.label?.toLowerCase().includes("tel") ||
        field.label?.toLowerCase().includes("mobile");
      const isDate =
        field.type === "date" || field.label?.toLowerCase().includes("date");

      let hasError = false;

      if (field.required && !val) {
        newErrors[fieldKey] = `${field.label} is required`;
        hasError = true;
      } else if (val) {
        if (isEmail) {
          const emailRegex =
            /^[a-zA-Z0-9]+([._%+-]?[a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-]?[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
          if (!emailRegex.test(val)) {
            newErrors[fieldKey] = "Please enter a valid email address";
            hasError = true;
          }
        } else if (isNumeric) {
          if (val.length !== 10 || !/^\d{10}$/.test(val)) {
            newErrors[fieldKey] = "Phone number must be 10 digits";
            hasError = true;
          }
        } else if (isDate) {
          const isBirthDate =
            field.label?.toLowerCase().includes("birth") ||
            field.label?.toLowerCase().includes("dob") ||
            field.label?.toLowerCase().includes("bday");
          if (isBirthDate) {
            try {
              const selectedDate = parseISO(val);
              const today = startOfDay(new Date());
              if (isBefore(today, selectedDate)) {
                newErrors[fieldKey] =
                  "Future dates are not allowed for birth date";
                hasError = true;
              }
            } catch (e) {
              const todayStr = format(new Date(), "dd-MM-yyyy");
              if (val > todayStr) {
                newErrors[fieldKey] =
                  "Future dates are not allowed for birth date";
                hasError = true;
              }
            }
          }
        }
      }

      if (hasError && !firstErrorKey) {
        firstErrorKey = fieldKey;
      }
    });

    setFieldErrors(newErrors);

    if (firstErrorKey) {
      setTimeout(() => {
        const el =
          document.getElementById(`field-${firstErrorKey}`) ||
          document.querySelector(`[data-field-key="${firstErrorKey}"]`);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!newBookingDate) {
      Toast({ message: "Please select a date.", type: "error" });
      return;
    }
    if (!newBookingSlot) {
      Toast({ message: "Please select a time slot.", type: "error" });
      return;
    }

    if (!validateDynamicResponses()) {
      return;
    }

    const [startTime, endTime] = newBookingSlot.split("-");
    setIsSaving(true);

    try {
      const res = await updateAdminBookingSuperRecord(bookingId, {
        slotDate: newBookingDate,
        slotStartTime: startTime,
        slotEndTime: endTime,
        status: editStatus,
        dynamicResponses: editResponses,
      });

      if (res.status === 200) {
        Toast({
          message: "Appointment updated successfully.",
          type: "success",
        });
        router.push(`/admins/appointments-list/${adminId}`);
      } else {
        Toast({
          message: res.data?.message || "Failed to update booking.",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      const errMsg =
        err?.response?.data?.message || "Failed to update appointment.";
      Toast({ message: errMsg, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageMeta
        title={`Edit Appointment - ${adminUser?.username || "Admin"} - Booking Admin`}
        description="Edit user appointment details"
      />
      <PageBreadcrumb
        items={[
          { label: "Home", to: "/" },
          { label: "Admins Management", to: "/admins" },
          {
            label: `Appointments List (${adminUser?.username || "Admin"})`,
            to: `/admins/appointments-list/${adminId}`,
          },
          { label: "Edit Appointment", to: "" },
        ]}
      />

      <div className="bg-white rounded-lg border border-gray-200 shadow-theme-xs w-full">
        <div className="p-4 border-b border-gray-200 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Edit Appointment Details
          </h3>
          <p className="text-sm text-gray-555 font-medium">
            Update appointment date, time window, status, and response details
            below.
          </p>
        </div>

        <form onSubmit={handleEditSubmit} noValidate className="p-4 sm:p-6">
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
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-2 hover:bg-gray-55 border-r border-gray-300 transition-colors"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="px-3 py-1.5 text-xs font-bold text-gray-700 min-w-28 text-center select-none">
                        {months[selectedMonth]}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-2 hover:bg-gray-55 border-l border-gray-300 transition-colors"
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
                      return (
                        <div
                          key={`empty-${idx}`}
                          className="aspect-square bg-gray-55/50 rounded-lg border border-transparent"
                        ></div>
                      );
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
                          ${
                            isClosed || isPast
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
                                ? ""
                                : `Select Date: ${dayObj.dateStr}`
                        }
                      >
                        {isHoliday ? (
                          <Tooltip
                            content={`Holiday: ${dayObj.holidayTitle || "Holiday"}`}
                          >
                            <div className="flex flex-col items-center justify-center w-full h-full min-h-[40px]">
                              <span>{dayObj.day}</span>
                              {isPast && (
                                <span className="text-[7px] text-gray-400 uppercase leading-none mt-0.5">
                                  Past
                                </span>
                              )}
                              {!isPast && isClosed && (
                                <span className="text-[7px] text-gray-400 uppercase leading-none mt-0.5">
                                  Off
                                </span>
                              )}
                              {!isPast && isFullDayHoliday && (
                                <span className="text-[7px] text-red-500 uppercase leading-none mt-0.5 font-bold">
                                  Hol
                                </span>
                              )}
                            </div>
                          </Tooltip>
                        ) : (
                          <div className="flex flex-col items-center justify-center w-full h-full min-h-[40px]">
                            <span>{dayObj.day}</span>
                            {isPast && (
                              <span className="text-[7px] text-gray-400 uppercase leading-none mt-0.5">
                                Past
                              </span>
                            )}
                            {!isPast && isClosed && (
                              <span className="text-[7px] text-gray-400 uppercase leading-none mt-0.5">
                                Off
                              </span>
                            )}
                            {!isPast && isFullDayHoliday && (
                              <span className="text-[7px] text-red-500 uppercase leading-none mt-0.5 font-bold">
                                Hol
                              </span>
                            )}
                          </div>
                        )}
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
                    <p className="text-xs text-gray-555 font-medium">
                      Choose an available slot and populate form fields below.
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-5">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Select Time Slot <span className="text-red-500">*</span>
                    </label>
                    {isLoadingSlots ? (
                      <p className="text-xs text-gray-400">
                        Loading available slots...
                      </p>
                    ) : (
                      <div>
                        <select
                          id="field-slot"
                          data-field-key="slot"
                          value={newBookingSlot}
                          onChange={(e) => {
                            setNewBookingSlot(e.target.value);
                            if (fieldErrors.slot) {
                              setFieldErrors((prev) => ({
                                ...prev,
                                slot: null,
                              }));
                            }
                          }}
                          className={`w-full p-2.5 border rounded-lg text-sm bg-white text-gray-800 focus:outline-none ${
                            fieldErrors.slot
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-300 focus:border-blue-500"
                          }`}
                        >
                          <option value="">-- Select a Slot --</option>
                          {(() => {
                            const renderedSlots = [...availableSlots];
                            if (
                              selectedBooking &&
                              selectedBooking.slotStartTime &&
                              selectedBooking.slotEndTime
                            ) {
                              const currentSlotKey = `${selectedBooking.slotStartTime}-${selectedBooking.slotEndTime}`;
                              const exists = renderedSlots.some(
                                (s) =>
                                  `${s.startTime}-${s.endTime}` ===
                                  currentSlotKey,
                              );
                              if (!exists) {
                                renderedSlots.unshift({
                                  startTime: selectedBooking.slotStartTime,
                                  endTime: selectedBooking.slotEndTime,
                                  status: "available",
                                });
                              }
                            }
                            return renderedSlots.map((s) => {
                              let isPastOrCurrent = false;
                              if (newBookingDate && s.startTime) {
                                try {
                                  const formattedTime = s.startTime.includes(
                                    ":",
                                  )
                                    ? s.startTime
                                        .split(":")
                                        .map((p) => p.padStart(2, "0"))
                                        .join(":")
                                    : s.startTime;
                                  const slotStartDateTime = parseISO(
                                    `${newBookingDate}T${formattedTime}:00`,
                                  );
                                  const now = new Date();
                                  const effectiveMinNotice =
                                    typeof minAdvanceNoticeMinutes ===
                                      "number" && minAdvanceNoticeMinutes > 0
                                      ? minAdvanceNoticeMinutes
                                      : slotSettings?.minAdvanceNoticeMinutes ||
                                        0;
                                  const cutoffTime =
                                    effectiveMinNotice > 0
                                      ? new Date(
                                          now.getTime() +
                                            effectiveMinNotice * 60 * 1000,
                                        )
                                      : now;
                                  isPastOrCurrent =
                                    isBefore(slotStartDateTime, cutoffTime) ||
                                    isEqual(slotStartDateTime, cutoffTime);
                                } catch (e) {}
                              }

                              const isCurrentSlot =
                                selectedBooking &&
                                `${s.startTime}-${s.endTime}` ===
                                  `${selectedBooking.slotStartTime}-${selectedBooking.slotEndTime}`;
                              const isAvailable =
                                (s.status === "available" || isCurrentSlot) &&
                                !isPastOrCurrent;
                              const isBooked =
                                s.status === "booked" && !isCurrentSlot;
                              const isBreak = s.status === "break";

                              let label = `${s.startTime} - ${s.endTime}`;
                              let optionClass = "";

                              if (isCurrentSlot && !isPastOrCurrent) {
                                label += " (Current Slot)";
                                optionClass =
                                  "bg-blue-50 text-blue-700 font-bold";
                              } else if (isBooked) {
                                label += " (Booked)";
                                optionClass =
                                  "bg-gray-100 text-gray-400 font-normal";
                              } else if (isBreak) {
                                label += " (Break Slot)";
                                optionClass =
                                  "bg-gray-100 text-gray-400 font-normal";
                              } else if (isPastOrCurrent) {
                                optionClass =
                                  "bg-gray-100 text-gray-400 font-normal";
                              } else {
                                optionClass =
                                  "bg-white text-gray-800 font-semibold";
                              }

                              return (
                                <option
                                  key={`${s.startTime}-${s.endTime}`}
                                  value={
                                    isAvailable
                                      ? `${s.startTime}-${s.endTime}`
                                      : ""
                                  }
                                  disabled={!isAvailable}
                                  className={optionClass}
                                >
                                  {label}
                                </option>
                              );
                            });
                          })()}
                        </select>
                        {fieldErrors.slot && (
                          <p className="mt-1.5 text-xs text-red-500 font-bold">
                            {fieldErrors.slot}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 border-t border-gray-100 pt-5">
                    <span className="block text-sm font-bold text-gray-550 border-b pb-1.5">
                      Response Fields
                    </span>
                    {formFields.map((field) => {
                      const fieldKey =
                        field.fieldKey || field.name || field.label;
                      const val = editResponses[fieldKey] || "";
                      const isEmail =
                        field.type === "email" ||
                        field.label?.toLowerCase().includes("email");
                      const isNumeric =
                        field.type === "tel" ||
                        field.type === "number" ||
                        field.label?.toLowerCase().includes("phone") ||
                        field.label?.toLowerCase().includes("tel") ||
                        field.label?.toLowerCase().includes("mobile");
                      const isDate =
                        field.type === "date" ||
                        field.label?.toLowerCase().includes("date");
                      const isBirthDate =
                        isDate &&
                        (field.label?.toLowerCase().includes("birth") ||
                          field.label?.toLowerCase().includes("dob") ||
                          field.label?.toLowerCase().includes("bday"));
                      const hasError = fieldErrors[fieldKey];

                      const inputBaseClass = `w-full p-2.5 border rounded-lg text-sm bg-white text-gray-800 focus:outline-none ${
                        hasError
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 focus:border-blue-500"
                      }`;

                      return (
                        <div key={fieldKey}>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            {field.label}{" "}
                            {field.required && (
                              <span className="text-red-500 font-semibold">
                                *
                              </span>
                            )}
                          </label>
                          {field.type === "select" ? (
                            <select
                              id={`field-${fieldKey}`}
                              data-field-key={fieldKey}
                              value={val}
                              onChange={(e) =>
                                handleEditResponseChange(
                                  fieldKey,
                                  e.target.value,
                                )
                              }
                              className={inputBaseClass}
                            >
                              <option value="">Select option</option>
                              {(field.options || []).map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : field.type === "multiselect_select" ? (
                            <MultiSelectDropdown
                              id={`field-${fieldKey}`}
                              dataFieldKey={fieldKey}
                              options={field.options || []}
                              value={val}
                              hasError={hasError}
                              onChange={(selected) =>
                                handleEditResponseChange(fieldKey, selected)
                              }
                              placeholder={`Select ${field.label.toLowerCase()}`}
                            />
                          ) : field.type === "checkbox" ? (
                            <label className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer select-none">
                              <input
                                id={`field-${fieldKey}`}
                                data-field-key={fieldKey}
                                type="checkbox"
                                checked={
                                  val === true ||
                                  val === "true" ||
                                  val === "1" ||
                                  val === 1
                                }
                                onChange={(e) =>
                                  handleEditResponseChange(
                                    fieldKey,
                                    e.target.checked,
                                  )
                                }
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-gray-700">
                                {field.label}
                              </span>
                            </label>
                          ) : field.type === "multiselect_checkbox" ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-gray-50 border border-gray-300 rounded-lg">
                              {(field.options || []).map((opt, optIdx) => {
                                const selectedArr = Array.isArray(val)
                                  ? val
                                  : typeof val === "string" && val
                                    ? val.split(",").map((s) => s.trim())
                                    : [];
                                const isChecked = selectedArr.includes(opt);
                                return (
                                  <label
                                    key={optIdx}
                                    className={`flex items-center gap-2 p-2 rounded border transition-all cursor-pointer select-none ${
                                      isChecked
                                        ? "bg-blue-50 border-blue-200 text-blue-800 font-semibold"
                                        : "bg-white border-gray-200 text-gray-700"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        let updated;
                                        if (isChecked) {
                                          updated = selectedArr.filter(
                                            (i) => i !== opt,
                                          );
                                        } else {
                                          updated = [...selectedArr, opt];
                                        }
                                        handleEditResponseChange(
                                          fieldKey,
                                          updated,
                                        );
                                      }}
                                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-xs font-medium">
                                      {opt}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : field.type === "radio" ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-gray-50 border border-gray-300 rounded-lg">
                              {(field.options || []).map((opt, optIdx) => {
                                const isSelected = val === opt;
                                return (
                                  <label
                                    key={optIdx}
                                    className={`flex items-center gap-2 p-2 rounded border transition-all cursor-pointer select-none ${
                                      isSelected
                                        ? "bg-blue-50 border-blue-200 text-blue-800 font-semibold"
                                        : "bg-white border-gray-200 text-gray-700"
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`radio-${fieldKey}`}
                                      value={opt}
                                      checked={isSelected}
                                      onChange={() =>
                                        handleEditResponseChange(fieldKey, opt)
                                      }
                                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-xs font-medium">
                                      {opt}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : field.type === "textarea" ? (
                            <textarea
                              id={`field-${fieldKey}`}
                              data-field-key={fieldKey}
                              value={val}
                              onChange={(e) =>
                                handleEditResponseChange(
                                  fieldKey,
                                  e.target.value,
                                )
                              }
                              className={`${inputBaseClass} min-h-20`}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                            />
                          ) : field.type === "image" ? (
                            <div className="space-y-2">
                              <div
                                className={`relative w-full p-3.5 bg-gray-50 border border-gray-300 rounded-lg`}
                              >
                                <input
                                  id={`file_input_${field.fieldKey}`}
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleFileChange(
                                      field.fieldKey,
                                      e.target.files[0],
                                      "image",
                                      e,
                                    )
                                  }
                                  className={
                                    val
                                      ? "hidden"
                                      : "w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer"
                                  }
                                />
                                {val && (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-2xs">
                                      <div className="flex items-center gap-2 truncate">
                                        <span className="text-xs font-bold text-blue-600 shrink-0">
                                          Selected File:
                                        </span>
                                        <span className="text-xs font-semibold text-gray-700 truncate">
                                          {getFileNameDisplay(
                                            val,
                                            field.fieldKey,
                                            "Attached Image",
                                          )}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleEditResponseChange(
                                            field.fieldKey,
                                            "",
                                          );
                                          setFileNames((prev) => ({
                                            ...prev,
                                            [field.fieldKey]: "",
                                          }));
                                          const inputEl =
                                            document.getElementById(
                                              `file_input_${field.fieldKey}`,
                                            );
                                          if (inputEl) inputEl.value = "";
                                        }}
                                        className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md border border-red-200 transition-colors shrink-0 cursor-pointer"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={val}
                                        alt={field.label}
                                        onClick={() =>
                                          setFilePreview({
                                            isOpen: true,
                                            url: val,
                                            type: "image",
                                            title: field.label,
                                          })
                                        }
                                        className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                                      />
                                      <label
                                        htmlFor={`file_input_${field.fieldKey}`}
                                        className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors shadow-2xs"
                                      >
                                        Change Image
                                      </label>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-400">
                                Accepts images only (max 5MB)
                              </p>
                            </div>
                          ) : field.type === "video" ? (
                            <div className="space-y-2">
                              <div
                                className={`relative w-full p-3.5 bg-gray-50 border border-gray-300 rounded-lg`}
                              >
                                <input
                                  id={`file_input_${field.fieldKey}`}
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) =>
                                    handleFileChange(
                                      field.fieldKey,
                                      e.target.files[0],
                                      "video",
                                      e,
                                    )
                                  }
                                  className={
                                    val
                                      ? "hidden"
                                      : "w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-600 hover:file:bg-purple-100 file:cursor-pointer cursor-pointer"
                                  }
                                />
                                {val && (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-2xs">
                                      <div className="flex items-center gap-2 truncate">
                                        <span className="text-xs font-bold text-purple-600 shrink-0">
                                          Selected File:
                                        </span>
                                        <span className="text-xs font-semibold text-gray-700 truncate">
                                          {getFileNameDisplay(
                                            val,
                                            field.fieldKey,
                                            "Attached Video",
                                          )}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleEditResponseChange(
                                            field.fieldKey,
                                            "",
                                          );
                                          setFileNames((prev) => ({
                                            ...prev,
                                            [field.fieldKey]: "",
                                          }));
                                          const inputEl =
                                            document.getElementById(
                                              `file_input_${field.fieldKey}`,
                                            );
                                          if (inputEl) inputEl.value = "";
                                        }}
                                        className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md border border-red-200 transition-colors shrink-0 cursor-pointer"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div
                                        onClick={() =>
                                          setFilePreview({
                                            isOpen: true,
                                            url: val,
                                            type: "video",
                                            title: field.label,
                                          })
                                        }
                                        className="cursor-pointer"
                                      >
                                        <video
                                          src={val}
                                          className="w-44 h-28 object-cover rounded-lg border border-gray-200 shadow-xs bg-black pointer-events-none"
                                        />
                                      </div>
                                      <label
                                        htmlFor={`file_input_${field.fieldKey}`}
                                        className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors shadow-2xs"
                                      >
                                        Change Video
                                      </label>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-400">
                                Accepts videos only (max 20MB)
                              </p>
                            </div>
                          ) : (
                            <input
                              id={`field-${fieldKey}`}
                              data-field-key={fieldKey}
                              type={
                                isNumeric
                                  ? "text"
                                  : isDate
                                    ? "date"
                                    : isEmail
                                      ? "email"
                                      : "text"
                              }
                              inputMode={isNumeric ? "numeric" : undefined}
                              maxLength={isNumeric ? 10 : undefined}
                              max={
                                isDate && isBirthDate
                                  ? format(new Date(), "yyyy-MM-dd")
                                  : undefined
                              }
                              value={val}
                              onChange={(e) => {
                                let inputVal = e.target.value;
                                if (isNumeric) {
                                  inputVal = inputVal
                                    .replace(/\D/g, "")
                                    .slice(0, 10);
                                }
                                handleEditResponseChange(fieldKey, inputVal);
                              }}
                              onKeyDown={(e) => {
                                if (isNumeric) {
                                  const allowedKeys = [
                                    "Backspace",
                                    "Tab",
                                    "Delete",
                                    "ArrowLeft",
                                    "ArrowRight",
                                    "Enter",
                                    "Home",
                                    "End",
                                  ];
                                  if (
                                    !allowedKeys.includes(e.key) &&
                                    !/^\d$/.test(e.key) &&
                                    !e.ctrlKey &&
                                    !e.metaKey
                                  ) {
                                    e.preventDefault();
                                  }
                                }
                              }}
                              onClick={(e) => {
                                if (
                                  isDate &&
                                  e.target &&
                                  typeof e.target.showPicker === "function"
                                ) {
                                  try {
                                    e.target.showPicker();
                                  } catch (err) {}
                                }
                              }}
                              placeholder={
                                isDate
                                  ? undefined
                                  : `Enter ${field.label.toLowerCase()}`
                              }
                              className={`${inputBaseClass} ${isDate ? "cursor-pointer" : ""}`}
                            />
                          )}
                          {hasError && (
                            <p className="mt-1.5 text-xs text-red-500 font-bold">
                              {hasError}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

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
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <Button
                      type="button"
                      onClick={() =>
                        router.push(`/admins/appointments-list/${adminId}`)
                      }
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving || !newBookingSlot}
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full justify-between min-h-[300px] border border-dashed border-gray-200 rounded-xl p-6 text-center">
                  <div className="my-auto space-y-2">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <h5 className="text-sm font-semibold text-gray-700">
                      No Date Selected
                    </h5>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto">
                      Please choose an open day on the calendar grid to
                      configure your new appointment slot.
                    </p>
                  </div>

                  <div className="flex justify-end pt-6 border-t border-gray-100 w-full shrink-0">
                    <Button
                      type="button"
                      onClick={() =>
                        router.push(`/admins/appointments-list/${adminId}`)
                      }
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Full Screen File View Modal */}
      <FileViewModal
        isOpen={filePreview.isOpen}
        onClose={() =>
          setFilePreview({ isOpen: false, url: "", type: "image", title: "" })
        }
        fileUrl={filePreview.url}
        fileType={filePreview.type}
        title={filePreview.title}
      />
    </>
  );
}
