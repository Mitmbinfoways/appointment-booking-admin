"use client";

import React, { useState, useEffect, useMemo } from "react";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import Button from "@/components/UI/Button";
import { CustomModal, DeleteConfirmModal } from "@/components/UI/Modal";
import { Toast } from "@/components/Toast";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { format, parse } from "date-fns";
import Tooltip from "@/components/UI/Tooltip";

const INITIAL_HOLIDAYS = [
  { date: "01-01-2026", title: "New Year's Day" },
  { date: "26-01-2026", title: "Republic Day" },
  { date: "17-03-2026", title: "Holi Festival" },
  { date: "15-08-2026", title: "Independence Day" },
  { date: "02-10-2026", title: "Gandhi Jayanti" },
  { date: "08-11-2026", title: "Diwali Festival" },
  { date: "25-12-2026", title: "Christmas Day" },
];

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-indexed (0 = Jan)

  const todayStr = useMemo(() => format(new Date(), "dd-MM-yyyy"), []);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeDate, setActiveDate] = useState("");
  const [holidayTitle, setHolidayTitle] = useState("");

  // Load from localStorage or seed initials
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("admin_holidays_v2");
      if (stored) {
        try {
          setHolidays(JSON.parse(stored));
        } catch (e) {
          setHolidays(INITIAL_HOLIDAYS);
        }
      } else {
        setHolidays(INITIAL_HOLIDAYS);
        localStorage.setItem("admin_holidays_v2", JSON.stringify(INITIAL_HOLIDAYS));
      }
    }
  }, []);

  const saveHolidaysToStorage = (updatedList) => {
    setHolidays(updatedList);
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_holidays_v2", JSON.stringify(updatedList));
    }
  };

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

      days.push({
        day: d,
        dateStr,
        isHoliday: !!holiday,
        holidayTitle: holiday ? holiday.title : null
      });
    }

    return days;
  }, [selectedYear, selectedMonth, holidays]);

  const handleDateClick = (dayObj) => {
    if (!dayObj.dateStr) return;
    setActiveDate(dayObj.dateStr);
    setHolidayTitle(dayObj.holidayTitle || "");
    setIsModalOpen(true);
  };

  const handleSaveHoliday = (e) => {
    e.preventDefault();
    if (!holidayTitle.trim()) {
      Toast({ message: "Please enter a holiday title", type: "error" });
      return;
    }

    let updatedList;
    const existingIndex = holidays.findIndex((h) => h.date === activeDate);

    if (existingIndex > -1) {
      updatedList = holidays.map((h, i) =>
        i === existingIndex ? { ...h, title: holidayTitle.trim() } : h
      );
      Toast({ message: `Holiday title updated for ${activeDate}`, type: "success" });
    } else {
      updatedList = [...holidays, { date: activeDate, title: holidayTitle.trim() }];
      Toast({ message: `Holiday added successfully for ${activeDate}`, type: "success" });
    }

    saveHolidaysToStorage(updatedList);
    setIsModalOpen(false);
  };

  const handleDeleteClick = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    const updatedList = holidays.filter((h) => h.date !== activeDate);
    saveHolidaysToStorage(updatedList);
    setIsDeleteModalOpen(false);
    Toast({ message: `Holiday removed for ${activeDate}`, type: "success" });
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
        items={[{ label: "Home", to: "/" }, { label: "Management", to: "/staff" }, { label: "Holidays", to: "/holidays" }]}
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
                  return <div key={`empty-${idx}`} className="aspect-square bg-gray-50/50 rounded-lg border border-transparent"></div>;
                }

                const isToday = dayObj.dateStr === todayStr;
                const cellTooltipContent = dayObj.isHoliday 
                  ? `${dayObj.holidayTitle} (${dayObj.dateStr})` 
                  : `Click to set holiday for ${dayObj.dateStr}`;

                return (
                  <div
                    key={dayObj.dateStr}
                    onClick={() => handleDateClick(dayObj)}
                    className={`aspect-square rounded-lg border cursor-pointer transition-all duration-200 select-none overflow-visible
                      ${dayObj.isHoliday
                        ? "bg-red-50/70 border-red-200 text-red-700 hover:bg-red-50 hover:shadow-sm"
                        : "bg-white border-gray-200 text-gray-800 hover:border-blue-300 hover:bg-blue-50/20"
                      }
                      ${isToday ? "!border-green-500 ring-2 ring-green-500/20" : ""}
                    `}
                  >
                    <Tooltip content={cellTooltipContent}>
                      <div className="w-full h-full flex flex-col justify-between p-1.5">
                        <span className={`text-xs font-semibold rounded flex items-center justify-center w-5 h-5 
                          ${dayObj.isHoliday
                            ? "bg-red-100 text-red-800"
                            : isToday
                              ? "bg-green-100 text-green-800 font-bold border border-green-200"
                              : "group-hover:bg-blue-50 group-hover:text-blue-600"
                          }
                        `}>
                          {dayObj.day}
                        </span>

                        {dayObj.isHoliday && (
                          <span className="block text-[10px] leading-tight truncate font-semibold text-red-650 text-left mt-0.5 max-w-full">
                            {dayObj.holidayTitle}
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

            {yearHolidays.length === 0 ? (
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
                        setActiveDate(h.date);
                        setHolidayTitle(h.title);
                        setIsModalOpen(true);
                      }}
                      className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-red-50/50 hover:border-red-200 border border-gray-100 rounded-lg transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex flex-col items-center justify-center w-9 h-9 bg-white border border-gray-200 rounded-lg text-center font-bold text-gray-700 shadow-sm group-hover:border-red-200 group-hover:text-red-700">
                          <span className="text-[9px] uppercase text-gray-400 group-hover:text-red-400 leading-none mb-0.5">{monthName}</span>
                          <span className="text-xs leading-none">{day}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-gray-800 group-hover:text-red-950 truncate max-w-[120px] sm:max-w-none">
                            {h.title}
                          </h4>
                          <span className="text-[10px] text-gray-400">{h.date}</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDate(h.date);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
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
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Holiday Title / Reason <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={holidayTitle}
              onChange={(e) => setHolidayTitle(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              placeholder="e.g. Independence Day, Eid, Christmas"
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            {holidays.some((h) => h.date === activeDate) ? (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="flex items-center gap-1.5 text-red-600 hover:text-red-800 text-sm font-semibold hover:underline"
              >
                <Trash2 size={16} />
                Remove Holiday
              </button>
            ) : (
              <div></div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save
              </Button>
            </div>
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
