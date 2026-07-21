"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { 
  getAdminFormConfigSuper, 
  getAvailableSlotsList, 
  updateAdminBookingSuperRecord, 
  getAdminHolidaysSuperList, 
  getAdminSlotSettingsSuper,
  getAdminsList,
  getAdminBookingsSuperList
} from "@/config/AxiosConfig";
import { Toast } from "@/components/Toast";
import Button from "@/components/UI/Button";
import Tooltip from "@/components/UI/Tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function EditAdminAppointmentPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const adminId = params.id;
  const bookingId = params.bookingId;
  const router = useRouter();

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
          const found = list.find(a => a._id === adminId);
          if (found) setAdminUser(found);
        }

        // 2. Load Booking Details
        const bookingsRes = await getAdminBookingsSuperList(adminId);
        let currentBooking = null;
        if (bookingsRes.status === 200 && bookingsRes.data?.statusCode === 200) {
          const list = bookingsRes.data.data?.bookings || [];
          currentBooking = list.find(b => b._id === bookingId);
          if (currentBooking) {
            setSelectedBooking(currentBooking);
            setEditStatus(currentBooking.status || "confirmed");
            setNewBookingDate(currentBooking.slotDate || "");
            setNewBookingSlot(`${currentBooking.slotStartTime}-${currentBooking.slotEndTime}`);

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
            fields.forEach(f => {
              const val = currentBooking.dynamicResponses?.[f.fieldKey] || currentBooking.dynamicResponses?.get?.(f.fieldKey);
              responses[f.fieldKey] = val !== undefined && val !== null ? val : "";
            });
            setEditResponses(responses);
          }
        }

        // 4. Load Holidays list
        const holidaysRes = await getAdminHolidaysSuperList(adminId);
        if (holidaysRes.status === 200 && holidaysRes.data?.statusCode === 200) {
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

  // Load available slots when date changes
  useEffect(() => {
    const loadSlots = async () => {
      if (!newBookingDate || !adminId) return;
      setIsLoadingSlots(true);
      try {
        const res = await getAvailableSlotsList(adminId, newBookingDate);
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
  }, [newBookingDate, adminId]);

  const handleEditResponseChange = (fieldKey, value) => {
    setEditResponses(prev => ({
      ...prev,
      [fieldKey]: value
    }));
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

    let missingField = null;
    formFields.forEach(f => {
      if (f.required && !editResponses[f.fieldKey]) {
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
      const val = editResponses[f.fieldKey];
      if (isEmail && val && !emailRegex.test(String(val).trim())) {
        Toast({ message: `Please enter a valid email address for "${f.label}".`, type: "error" });
        return;
      }
    }

    const [startTime, endTime] = newBookingSlot.split("-");
    setIsSaving(true);

    try {
      const res = await updateAdminBookingSuperRecord(bookingId, {
        slotDate: newBookingDate,
        slotStartTime: startTime,
        slotEndTime: endTime,
        status: editStatus,
        dynamicResponses: editResponses
      });

      if (res.status === 200) {
        Toast({ message: "Appointment updated successfully.", type: "success" });
        router.push(`/admins/appointments-list/${adminId}`);
      } else {
        Toast({ message: res.data?.message || "Failed to update booking.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      const errMsg = err?.response?.data?.message || "Failed to update appointment.";
      Toast({ message: errMsg, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageMeta title={`Edit Appointment - ${adminUser?.username || "Admin"} - Booking Admin`} description="Edit user appointment details" />
      <PageBreadcrumb
        items={[
          { label: "Home", to: "/" },
          { label: "Admins Management", to: "/admins" },
          { label: `Appointments List (${adminUser?.username || "Admin"})`, to: `/admins/appointments-list/${adminId}` },
          { label: "Edit Appointment", to: "" }
        ]}
      />

      <div className="bg-white rounded-lg border border-gray-200 shadow-theme-xs w-full">
        <div className="p-4 border-b border-gray-200 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900">Edit Appointment Details</h3>
          <p className="text-sm text-gray-555 font-medium">Update appointment date, time window, status, and response details below.</p>
        </div>

        <form onSubmit={handleEditSubmit} className="p-4 sm:p-6">
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
                                ? ""
                                : `Select Date: ${dayObj.dateStr}`
                        }
                      >
                        {isHoliday ? (
                          <Tooltip content={`Holiday: ${dayObj.holidayTitle || "Holiday"}`}>
                            <div className="flex flex-col items-center justify-center w-full h-full min-h-[40px]">
                              <span>{dayObj.day}</span>
                              {isPast && <span className="text-[7px] text-gray-400 uppercase leading-none mt-0.5">Past</span>}
                              {!isPast && isClosed && <span className="text-[7px] text-gray-400 uppercase leading-none mt-0.5">Off</span>}
                              {!isPast && isFullDayHoliday && <span className="text-[7px] text-red-500 uppercase leading-none mt-0.5 font-bold">Hol</span>}
                            </div>
                          </Tooltip>
                        ) : (
                          <div className="flex flex-col items-center justify-center w-full h-full min-h-[40px]">
                            <span>{dayObj.day}</span>
                            {isPast && <span className="text-[7px] text-gray-400 uppercase leading-none mt-0.5">Past</span>}
                            {!isPast && isClosed && <span className="text-[7px] text-gray-400 uppercase leading-none mt-0.5">Off</span>}
                            {!isPast && isFullDayHoliday && <span className="text-[7px] text-red-500 uppercase leading-none mt-0.5 font-bold">Hol</span>}
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
                    <p className="text-xs text-gray-555 font-medium">Choose an available slot and populate form fields below.</p>
                  </div>

                  <div className="border-t border-gray-100 pt-5">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Select Time Slot <span className="text-red-500">*</span>
                    </label>
                    {isLoadingSlots ? (
                      <p className="text-xs text-gray-400">Loading available slots...</p>
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
                    <span className="block text-sm font-bold text-gray-555 border-b pb-1.5">Response Fields</span>
                    {formFields.map((field) => {
                      const val = editResponses[field.fieldKey] || "";
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
                              onChange={(e) => handleEditResponseChange(field.fieldKey, e.target.value)}
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
                              onChange={(e) => handleEditResponseChange(field.fieldKey, e.target.value)}
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
                                handleEditResponseChange(field.fieldKey, inputVal);
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

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <Button type="button" onClick={() => router.push(`/admins/appointments-list/${adminId}`)} variant="secondary">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving || !newBookingSlot}>
                      {isSaving ? "Saving..." : "Save Changes"}
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
                    <Button type="button" onClick={() => router.push(`/admins/appointments-list/${adminId}`)} variant="secondary">
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
