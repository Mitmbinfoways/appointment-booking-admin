"use client";

import React, { useState, useEffect, useMemo } from "react";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import Button from "@/components/UI/Button";
import { CustomModal, DeleteConfirmModal } from "@/components/UI/Modal";
import { Toast } from "@/components/Toast";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Trash2, Pencil } from "lucide-react";
import { format, parse } from "date-fns";
import Tooltip from "@/components/UI/Tooltip";
import {
  getHolidaysList,
  createHolidayRecord,
  updateHolidayRecord,
  deleteHolidayRecord,
  getAdminSlotSettings,
} from "@/config/AxiosConfig";

const formatTime12h = (timeStr) => {
  if (!timeStr) return "";
  const [hoursStr, minutesStr] = timeStr.split(":");
  const hours = parseInt(hoursStr, 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const padHours = String(displayHours).padStart(2, "0");
  return `${padHours}:${minutesStr} ${ampm}`;
};

const toDbDateFormat = (dateStr) => {
  if (!dateStr) return "";
  const [d, m, y] = dateStr.split("-");
  return `${y}-${m}-${d}`;
};

const toUiDateFormat = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}-${m}-${y}`;
};

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState([]);
  const [slotSettings, setSlotSettings] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-indexed (0 = Jan)
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const todayStr = useMemo(() => format(new Date(), "dd-MM-yyyy"), []);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeDate, setActiveDate] = useState("");
  const [holidayTitle, setHolidayTitle] = useState("");
  const [holidayType, setHolidayType] = useState("full"); // 'full', 'half', 'custom'
  const [halfDayType, setHalfDayType] = useState("first_half"); // 'first_half', 'second_half'
  const [customStartTime, setCustomStartTime] = useState("09:00");
  const [customEndTime, setCustomEndTime] = useState("17:00");

  const fetchHolidays = async () => {
    setIsLoading(true);
    try {
      const res = await getHolidaysList();
      if (res.status === 200 && res.data?.statusCode === 200) {
        const loaded = (res.data.data || []).map((h) => ({
          ...h,
          date: toUiDateFormat(h.date),
          title: h.reason || "Holiday",
        }));
        setHolidays(loaded);
      }
    } catch (err) {
      console.error(err);
      Toast({ message: "Error loading holidays from server.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSlotSettings = async () => {
    try {
      const res = await getAdminSlotSettings();
      if (res.status === 200 && res.data?.statusCode === 200) {
        setSlotSettings(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching slot settings:", err);
    }
  };

  useEffect(() => {
    fetchHolidays();
    fetchSlotSettings();
  }, []);

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
      const dateStr = format(currentDateObj, "dd-MM-yyyy");

      const holiday = holidays.find((h) => h.date === dateStr);

      const weekdayName = format(currentDateObj, "EEEE");
      let isClosedDay = false;
      if (slotSettings && slotSettings.workingDays) {
        const dayConfig = slotSettings.workingDays.find((wd) => wd.day === weekdayName);
        if (dayConfig && !dayConfig.isOpen) {
          isClosedDay = true;
        }
      }

      const todayAtMidnight = new Date();
      todayAtMidnight.setHours(0, 0, 0, 0);
      const cellDateAtMidnight = new Date(selectedYear, selectedMonth, d);
      cellDateAtMidnight.setHours(0, 0, 0, 0);
      const isPastDay = cellDateAtMidnight < todayAtMidnight;

      days.push({
        day: d,
        dateStr,
        isHoliday: !!holiday,
        isClosedDay,
        isPastDay,
        holidayTitle: holiday ? holiday.title : null,
        holidayType: holiday ? holiday.holidayType : null,
        halfDayType: holiday ? holiday.halfDayType : null,
        customStartTime: holiday ? holiday.customStartTime : null,
        customEndTime: holiday ? holiday.customEndTime : null,
      });
    }

    return days;
  }, [selectedYear, selectedMonth, holidays, slotSettings]);

  const handleDateClick = (dayObj) => {
    if (!dayObj.dateStr) return;
    setActiveDate(dayObj.dateStr);

    const existing = holidays.find((h) => h.date === dayObj.dateStr);
    if (existing) {
      setHolidayTitle(existing.title || "");
      setHolidayType(existing.holidayType || "full");
      setHalfDayType(existing.halfDayType || "first_half");
      setCustomStartTime(existing.customStartTime || "09:00");
      setCustomEndTime(existing.customEndTime || "17:00");
    } else {
      setHolidayTitle("");
      setHolidayType("full");
      setHalfDayType("first_half");
      setCustomStartTime("09:00");
      setCustomEndTime("17:00");
    }
    setIsModalOpen(true);
  };

  const handleSaveHoliday = async (e) => {
    e.preventDefault();
    if (!holidayTitle.trim()) {
      Toast({ message: "Please enter a holiday title / reason", type: "error" });
      return;
    }

    const payload = {
      date: toDbDateFormat(activeDate),
      holidayType,
      halfDayType: holidayType === "half" ? halfDayType : undefined,
      customStartTime: holidayType === "custom" ? customStartTime : undefined,
      customEndTime: holidayType === "custom" ? customEndTime : undefined,
      reason: holidayTitle.trim(),
    };

    const existing = holidays.find((h) => h.date === activeDate);
    setIsSaving(true);
    try {
      if (existing) {
        const res = await updateHolidayRecord(existing._id, payload);
        if (res.status === 200 && res.data?.statusCode === 200) {
          Toast({ message: `Holiday updated successfully for ${activeDate}`, type: "success" });
          await fetchHolidays();
        } else {
          Toast({ message: "Failed to update holiday.", type: "error" });
        }
      } else {
        const res = await createHolidayRecord(payload);
        if (res.status === 201 && res.data?.statusCode === 201) {
          Toast({ message: `Holiday added successfully for ${activeDate}`, type: "success" });
          await fetchHolidays();
        } else {
          Toast({ message: "Failed to create holiday.", type: "error" });
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Error saving holiday config.";
      Toast({ message: msg, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    const existing = holidays.find((h) => h.date === activeDate);
    if (!existing) return;

    setIsSaving(true);
    try {
      const res = await deleteHolidayRecord(existing._id);
      if (res.status === 200 && res.data?.statusCode === 200) {
        Toast({ message: `Holiday removed successfully.`, type: "success" });
        await fetchHolidays();
      } else {
        Toast({ message: "Failed to delete holiday.", type: "error" });
      }
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error(err);
      Toast({ message: "Error deleting holiday.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Filter holidays for the selected year for sidebar display
  const yearHolidays = useMemo(() => {
    return holidays
      .filter((h) => h.date.endsWith(String(selectedYear)))
      .sort((a, b) => {
        const dateA = parse(a.date, "dd-MM-yyyy", new Date());
        const dateB = parse(b.date, "dd-MM-yyyy", new Date());
        return dateA - dateB;
      });
  }, [holidays, selectedYear]);

  // Nice date formatter helper for modals
  const activeDateFormatted = useMemo(() => {
    if (!activeDate) return "";
    try {
      const dateObj = parse(activeDate, "dd-MM-yyyy", new Date());
      return format(dateObj, "dd MMMM yyyy");
    } catch (e) {
      return activeDate;
    }
  }, [activeDate]);

  return (
    <>
      <PageMeta title="Holiday Management - Booking Admin" description="Configure company holidays on calendar" />
      <PageBreadcrumb
        items={[{ label: "Home", to: "/" }, { label: "Holidays Management", to: "/holidays" }]}
      />

      <div className="pb-4 flex flex-col lg:flex-row gap-5 items-stretch w-full">

        {/* Calendar Panel */}
        <div className="w-full lg:w-[580px] bg-white rounded-lg border border-gray-200 shadow-theme-xs p-4 shrink-0 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-3.5">
              {/* Year & Month Selection */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-gray-50 border-r border-gray-300 transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-3 py-1.5 text-xs font-bold text-gray-700 min-w-28 text-center select-none">
                    {months[selectedMonth]}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-gray-50 border-l border-gray-300 transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    setSelectedYear(today.getFullYear());
                    setSelectedMonth(today.getMonth());
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors select-none"
                >
                  Today
                </button>
              </div>

              <p className="text-[10px] text-gray-400 font-medium">
                * Click on any date to set or update a holiday
              </p>
            </div>

            {/* Calendar Grid */}
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

                const isToday = dayObj.dateStr === todayStr;
                const isActive = dayObj.dateStr === activeDate;
                const isClosed = dayObj.isClosedDay;
                const isPast = dayObj.isPastDay;
                
                const cellTooltipContent = isPast
                  ? "Past Date (Cannot set holiday)"
                  : isClosed
                    ? "Closed Day (Normal Off-Day)"
                    : dayObj.isHoliday
                      ? `${dayObj.holidayTitle}`
                      : null;

                return (
                  <div
                    key={dayObj.dateStr}
                    onClick={() => {
                      if (isClosed || isPast) return;
                      handleDateClick(dayObj);
                    }}
                    className={`aspect-square rounded-lg transition-all duration-200 select-none overflow-visible
                      ${isClosed || isPast
                        ? "bg-gray-100/70 text-gray-400 border border-gray-200 cursor-not-allowed"
                        : dayObj.isHoliday
                          ? "bg-red-50/70 text-red-700 hover:bg-red-50 hover:shadow-sm cursor-pointer border border-red-200"
                          : "bg-white text-gray-800 hover:bg-blue-50/20 cursor-pointer border border-gray-200 hover:border-blue-600"
                      }
                      ${!isClosed && !isPast && isActive ? "border border-blue-600 shadow-sm" : ""}
                      ${!isClosed && !isPast && isToday ? "border-2 border-green-600" : ""}
                    `}
                  >
                    <Tooltip content={cellTooltipContent}>
                      <div className="w-full h-full flex flex-col justify-between p-1.5">
                        <span className={`text-xs font-semibold rounded flex items-center justify-center w-5 h-5 
                          ${isClosed || isPast
                            ? "bg-gray-200 text-gray-450 font-medium"
                            : dayObj.isHoliday
                              ? "bg-red-100 text-red-800"
                              : isToday
                                ? "bg-green-100 text-green-800 font-bold border border-green-200"
                                : "group-hover:bg-blue-50 group-hover:text-blue-600"
                          }
                        `}>
                          {dayObj.day}
                        </span>

                        {dayObj.isHoliday && (
                          <span className="block text-[9px] leading-tight truncate font-semibold text-red-650 text-left mt-0.5 max-w-full">
                            {dayObj.holidayTitle}
                          </span>
                        )}

                        {isPast && (
                          <span className="block text-[8px] leading-tight truncate font-semibold text-gray-400 text-left mt-0.5 max-w-full uppercase tracking-tighter">
                            Past
                          </span>
                        )}

                        {!isPast && isClosed && (
                          <span className="block text-[8px] leading-tight truncate font-semibold text-gray-400 text-left mt-0.5 max-w-full uppercase tracking-tighter">
                            Closed
                          </span>
                        )}
                      </div>
                    </Tooltip>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Holidays List Sidebar */}
        <div className="w-full lg:flex-1 bg-white rounded-lg border border-gray-200 shadow-theme-xs p-4 flex flex-col min-w-0 self-stretch justify-between">
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 border-b border-gray-150 pb-3 mb-3 shrink-0">
              <CalendarIcon className="text-gray-500" size={18} />
              <h3 className="text-md font-bold text-gray-800">Holidays in {selectedYear}</h3>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-gray-400 text-xs flex-1 flex items-center justify-center">
                Loading holidays...
              </div>
            ) : yearHolidays.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs flex-1 flex items-center justify-center">
                No holidays configured for {selectedYear}
              </div>
            ) : (
              <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
                {yearHolidays.map((h) => {
                  const dateObj = parse(h.date, "dd-MM-yyyy", new Date());
                  const day = format(dateObj, "d");
                  const monthName = format(dateObj, "MMM");

                  return (
                    <div
                      key={h.date}
                      onClick={() => {
                        const monthVal = dateObj.getMonth();
                        setSelectedMonth(monthVal);
                        setSelectedYear(dateObj.getFullYear());
                        setActiveDate(h.date);
                        setHolidayTitle(h.title);
                        setHolidayType(h.holidayType || "full");
                        setHalfDayType(h.halfDayType || "first_half");
                        setCustomStartTime(h.customStartTime || "09:00");
                        setCustomEndTime(h.customEndTime || "17:00");
                      }}
                      className={`flex items-center justify-between p-2.5 hover:bg-red-50/50 hover:border-red-200 border rounded-lg transition-all duration-200 cursor-pointer group
                        ${h.date === activeDate
                          ? "bg-red-50/70 border-red-200"
                          : "bg-gray-55 border-gray-100"
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`flex flex-col items-center justify-center w-9 h-9 bg-white border rounded-lg text-center font-bold shadow-sm transition-all shrink-0
                          ${h.date === activeDate
                            ? "border-red-200 text-red-700"
                            : "border-gray-200 text-gray-700 group-hover:border-red-200 group-hover:text-red-700"
                          }
                        `}>
                          <span className={`text-[9px] uppercase leading-none mb-0.5 transition-all
                            ${h.date === activeDate
                              ? "text-red-400"
                              : "text-gray-400 group-hover:text-red-400"
                            }
                          `}>{monthName}</span>
                          <span className="text-xs leading-none">{day}</span>
                        </div>
                        <div className="min-w-0">
                          <h4 className={`font-semibold text-xs truncate max-w-[120px] sm:max-w-none transition-all
                            ${h.date === activeDate ? "text-red-950" : "text-gray-800 group-hover:text-red-950"}
                          `}>
                            {h.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                            <span className="text-[10px] text-gray-450">{h.date}</span>
                            <span className="text-[8px] text-gray-300">•</span>
                            <span className="text-[9px] font-semibold text-blue-705 bg-blue-50/50 px-1 py-0.2 rounded">
                              {h.holidayType === "full" && "Full Day"}
                              {h.holidayType === "half" && `Half Day (${h.halfDayType === "first_half" ? "Morning Off" : "Afternoon Off"})`}
                              {h.holidayType === "custom" && `Custom Time`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const monthVal = dateObj.getMonth();
                            setSelectedMonth(monthVal);
                            setSelectedYear(dateObj.getFullYear());
                            setActiveDate(h.date);
                            setHolidayTitle(h.title);
                            setHolidayType(h.holidayType || "full");
                            setHalfDayType(h.halfDayType || "first_half");
                            setCustomStartTime(h.customStartTime || "09:00");
                            setCustomEndTime(h.customEndTime || "17:00");
                            setIsModalOpen(true);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Edit Holiday"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDate(h.date);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete Holiday"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Set/Update Holiday Modal */}
      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSaveHoliday} className="space-y-4">
          <h4 className="text-xl font-bold text-gray-800 mb-1">
            {holidays.some((h) => h.date === activeDate) ? "Update Holiday" : "Configure Holiday"}
          </h4>
          <p className="text-xs text-gray-400 font-medium">
            For Date: <span className="text-gray-700 font-semibold">{activeDateFormatted}</span>
          </p>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Holiday Title / Reason <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={holidayTitle}
              onChange={(e) => setHolidayTitle(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white text-gray-800"
              placeholder="e.g. Independence Day, Eid, Christmas"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Holiday Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["full", "half", "custom"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setHolidayType(t)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                    holidayType === t
                      ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {t === "full" && "Full Day"}
                  {t === "half" && "Half Day"}
                  {t === "custom" && "Custom Time"}
                </button>
              ))}
            </div>
          </div>

          {holidayType === "half" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Half Day Selection <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "first_half", label: "First Half (Off before Break / Midpoint)" },
                  { value: "second_half", label: "Second Half (Off after Break / Midpoint)" }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setHalfDayType(item.value)}
                    className={`py-2 px-3 text-[10px] leading-tight font-semibold rounded-lg border transition-all ${
                      halfDayType === item.value
                        ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {holidayType === "custom" && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-xs font-semibold text-gray-650 mb-1">
                  Available From (Start Time) <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-655 mb-1">
                  Available To (End Time) <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={customEndTime}
                  onChange={(e) => setCustomEndTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </CustomModal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Remove Holiday"
        message="Are you sure you want to remove this day off? Staff schedules will revert to normal."
        itemName={activeDateFormatted}
      />
    </>
  );
}
