"use client";

import React, { useState, useEffect, use } from "react";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import Button from "@/components/UI/Button";
import { getAdminSlotSettingsSuper, updateAdminSlotSettingsSuper } from "@/config/AxiosConfig";
import { Toast } from "@/components/Toast";
import { useRouter } from "next/navigation";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const formatTime12h = (timeStr) => {
  if (!timeStr) return "";
  const [hoursStr, minutesStr] = timeStr.split(":");
  const hours = parseInt(hoursStr, 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const padHours = String(displayHours).padStart(2, "0");
  return `${padHours}:${minutesStr} ${ampm}`;
};

const formatDurationLabel = (minutes) => {
  const num = Number(minutes);
  if (!num || isNaN(num)) return "0 Minutes";
  if (num < 60) return `${num} Minutes`;
  const hours = Math.floor(num / 60);
  const mins = num % 60;
  const hrLabel = hours === 1 ? "1 Hour" : `${hours} Hours`;
  if (mins === 0) return hrLabel;
  return `${hrLabel} ${mins} Minutes`;
};

export default function AdminSlotSettingsPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const adminId = params.id;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);
  
  const [slotSettings, setSlotSettings] = useState({
    slotDurationMinutes: 30,
    capacityPerSlot: 1,
    workingDays: [],
  });

  const fetchSlotSettings = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminSlotSettingsSuper(adminId);
      if (res.status === 200 && res.data?.statusCode === 200) {
        const dbDays = res.data.data.workingDays || [];
        const mappedDays = WEEKDAYS.map((dayName) => {
          const found = dbDays.find((d) => d.day === dayName);
          if (found) {
            return {
              ...found,
              isEditingHours: false,
              breakTimes: (found.breakTimes || []).map((b) => ({
                ...b,
                isEditing: false,
              })),
            };
          }
          return {
            day: dayName,
            isOpen: false,
            startTime: "09:00",
            endTime: "17:00",
            isEditingHours: false,
            breakTimes: [],
          };
        });

        setSlotSettings({
          slotDurationMinutes: res.data.data.slotDurationMinutes,
          capacityPerSlot: res.data.data.capacityPerSlot,
          workingDays: mappedDays,
        });
      } else {
        Toast({ message: "Failed to load slot settings.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      Toast({ message: "Connection error loading settings.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlotSettings();
  }, [adminId]);

  const handleSlotSettingsChange = (field, value) => {
    setSlotSettings((prev) => ({ ...prev, [field]: value }));
  };

  const saveSlotSettings = async (updatedSettings, shouldRedirect = false) => {
    setIsSaving(true);
    try {
      const cleanedWorkingDays = updatedSettings.workingDays.map((day) => ({
        day: day.day,
        isOpen: day.isOpen,
        startTime: day.startTime,
        endTime: day.endTime,
        breakTimes: (day.breakTimes || []).map(({ name, startTime, endTime }) => ({
          name,
          startTime,
          endTime,
        })),
      }));

      const res = await updateAdminSlotSettingsSuper(adminId, {
        ...updatedSettings,
        workingDays: cleanedWorkingDays,
      });

      if (res.status === 200 && res.data?.statusCode === 200) {
        Toast({ message: "Slot settings synced successfully.", type: "success" });

        const dbDays = res.data.data.workingDays || [];
        const mappedDays = WEEKDAYS.map((dayName) => {
          const found = dbDays.find((d) => d.day === dayName);
          const localDay = updatedSettings.workingDays.find((d) => d.day === dayName) || {};
          if (found) {
            return {
              ...found,
              isEditingHours: localDay.isEditingHours || false,
              breakTimes: (found.breakTimes || []).map((b, bIdx) => {
                const localBreak = (localDay.breakTimes || [])[bIdx] || {};
                return {
                  ...b,
                  isEditing: localBreak.isEditing || false,
                };
              }),
            };
          }
          return {
            day: dayName,
            isOpen: false,
            startTime: "09:00",
            endTime: "17:00",
            isEditingHours: false,
            breakTimes: [],
          };
        });

        setSlotSettings({
          slotDurationMinutes: res.data.data.slotDurationMinutes,
          capacityPerSlot: res.data.data.capacityPerSlot,
          workingDays: mappedDays,
        });

        if (shouldRedirect) {
          router.push("/admins");
        }
      } else {
        Toast({ message: "Failed to update slot settings.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      Toast({ message: "Connection error saving settings.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleWorkingDayOpen = (dayName) => {
    const updatedDays = slotSettings.workingDays.map((d) => {
      if (d.day === dayName) {
        const nextOpen = !d.isOpen;
        return {
          ...d,
          isOpen: nextOpen,
          isEditingHours: nextOpen, // Default to editing mode when opened, close edit mode when closed
        };
      }
      return d;
    });
    const nextSettings = { ...slotSettings, workingDays: updatedDays };
    setSlotSettings(nextSettings);
    saveSlotSettings(nextSettings, false);
  };

  const handleWorkingDayChange = (dayName, field, value) => {
    setSlotSettings((prev) => {
      const updatedDays = prev.workingDays.map((d) => {
        if (d.day === dayName) {
          return { ...d, [field]: value };
        }
        return d;
      });
      return { ...prev, workingDays: updatedDays };
    });
  };

  const handleToggleWorkingDayHoursEdit = (dayName, isEditingVal) => {
    const updatedDays = slotSettings.workingDays.map((d) => {
      if (d.day === dayName) {
        return { ...d, isEditingHours: isEditingVal };
      }
      return d;
    });
    const nextSettings = { ...slotSettings, workingDays: updatedDays };
    setSlotSettings(nextSettings);
    if (!isEditingVal) {
      saveSlotSettings(nextSettings, false);
    }
  };

  // Day-wise Break Times handlers
  const handleAddDayBreak = (dayName) => {
    setSlotSettings((prev) => {
      const updatedDays = prev.workingDays.map((d) => {
        if (d.day === dayName) {
          return {
            ...d,
            breakTimes: [
              ...(d.breakTimes || []),
              { name: "Lunch Break", startTime: "13:00", endTime: "14:00", isEditing: true }
            ]
          };
        }
        return d;
      });
      return { ...prev, workingDays: updatedDays };
    });
  };

  const handleRemoveDayBreak = (dayName, breakIndex) => {
    const updatedDays = slotSettings.workingDays.map((d) => {
      if (d.day === dayName) {
        return {
          ...d,
          breakTimes: (d.breakTimes || []).filter((_, idx) => idx !== breakIndex)
        };
      }
      return d;
    });
    const nextSettings = { ...slotSettings, workingDays: updatedDays };
    setSlotSettings(nextSettings);
    saveSlotSettings(nextSettings, false);
  };

  const handleDayBreakChange = (dayName, breakIndex, field, value) => {
    setSlotSettings((prev) => {
      const updatedDays = prev.workingDays.map((d) => {
        if (d.day === dayName) {
          const updatedBreaks = (d.breakTimes || []).map((b, idx) =>
            idx === breakIndex ? { ...b, [field]: value } : b
          );
          return { ...d, breakTimes: updatedBreaks };
        }
        return d;
      });
      return { ...prev, workingDays: updatedDays };
    });
  };

  const handleToggleBreakEdit = (dayName, breakIndex, isEditingVal) => {
    const updatedDays = slotSettings.workingDays.map((d) => {
      if (d.day === dayName) {
        const updatedBreaks = (d.breakTimes || []).map((b, idx) =>
          idx === breakIndex ? { ...b, isEditing: isEditingVal } : b
        );
        return { ...d, breakTimes: updatedBreaks };
      }
      return d;
    });
    const nextSettings = { ...slotSettings, workingDays: updatedDays };
    setSlotSettings(nextSettings);
    if (!isEditingVal) {
      saveSlotSettings(nextSettings, false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveSlotSettings(slotSettings, true);
  };

  return (
    <>
      <PageMeta title="Configure Slot Settings" description="SuperAdmin Admin Slot Config Panel" />
      <PageBreadcrumb
        items={[
          { label: "Home", to: "/" },
          { label: "Admins Management", to: "/admins" },
          { label: "Slot Settings", to: `/admins/${adminId}/slots` }
        ]}
      />

      <div className="bg-white rounded-lg border border-gray-200 shadow-theme-xs p-6 max-w-4xl mx-auto">
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Configure Booking Slots & Working Days</h3>
          <p className="text-sm text-gray-500">Edit default slot sizing, hourly limits, and daily availability with custom breaks.</p>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            Loading slot settings...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700">
                    Slot Duration (Minutes)
                  </label>
                  {!isEditingDuration ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingDuration(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 focus:outline-none"
                      title="Edit Slot Duration"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingDuration(false);
                        saveSlotSettings(slotSettings, false);
                      }}
                      className="text-xs text-green-600 hover:text-green-800 font-semibold flex items-center gap-1 focus:outline-none"
                      title="Save Slot Duration"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Save
                    </button>
                  )}
                </div>

                {!isEditingDuration ? (
                  <div className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 font-medium flex items-center justify-between">
                    <span>{formatDurationLabel(slotSettings.slotDurationMinutes)}</span>
                    <span className="text-xs text-gray-400">({slotSettings.slotDurationMinutes} mins)</span>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <select
                      value={[15, 30, 45, 60, 90, 120].includes(slotSettings.slotDurationMinutes) ? slotSettings.slotDurationMinutes : "custom"}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== "custom") {
                          handleSlotSettingsChange("slotDurationMinutes", Number(val));
                        }
                      }}
                      className="w-full px-4 py-2 border border-blue-500 rounded-lg text-sm bg-white text-gray-800 focus:outline-none"
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                      <option value={60}>60 Minutes (1 Hour)</option>
                      <option value={90}>90 Minutes (1 Hour 30 Minutes)</option>
                      <option value={120}>120 Minutes (2 Hours)</option>
                      <option value="custom">Custom Minutes...</option>
                    </select>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs font-semibold text-gray-600">Custom Minutes:</span>
                      <input
                        type="number"
                        min={1}
                        value={slotSettings.slotDurationMinutes}
                        onChange={(e) => handleSlotSettingsChange("slotDurationMinutes", Math.max(1, Number(e.target.value)))}
                        className="w-28 p-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-800 focus:outline-none focus:border-blue-500 font-semibold"
                        placeholder="e.g. 5, 7, 75, 80"
                      />
                      <span className="text-xs text-blue-600 font-medium">
                        {formatDurationLabel(slotSettings.slotDurationMinutes)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700">
                    Capacity Per Slot (Max Concurrent Bookings)
                  </label>
                  {!isEditingCapacity ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingCapacity(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 focus:outline-none"
                      title="Edit Capacity"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingCapacity(false);
                        saveSlotSettings(slotSettings, false);
                      }}
                      className="text-xs text-green-600 hover:text-green-800 font-semibold flex items-center gap-1 focus:outline-none"
                      title="Save Capacity"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Save
                    </button>
                  )}
                </div>

                {!isEditingCapacity ? (
                  <div className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 font-medium">
                    {slotSettings.capacityPerSlot}
                  </div>
                ) : (
                  <input
                    type="number"
                    min={1}
                    required
                    value={slotSettings.capacityPerSlot}
                    onChange={(e) => handleSlotSettingsChange("capacityPerSlot", Number(e.target.value))}
                    className="w-full px-4 py-2 border border-blue-500 rounded-lg text-sm bg-white text-gray-800 focus:outline-none"
                  />
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Working Days & Schedules</h4>
              <div className="flex flex-col gap-4">
                {WEEKDAYS.map((dayName) => {
                  const dayObj = slotSettings.workingDays.find((d) => d.day === dayName) || {
                    day: dayName,
                    isOpen: false,
                    startTime: "09:00",
                    endTime: "17:00",
                    isEditingHours: false,
                    breakTimes: [],
                  };

                  return (
                    <div key={dayName} className="flex flex-col gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 w-32">
                          <button
                            type="button"
                            onClick={() => handleToggleWorkingDayOpen(dayName)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              dayObj.isOpen ? "bg-blue-600" : "bg-gray-200"
                            }`}
                          >
                            <span className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              dayObj.isOpen ? "translate-x-4" : "translate-x-0"
                            }`} />
                          </button>
                          <span className="text-sm font-semibold text-gray-800">{dayName}</span>
                        </div>

                        {dayObj.isOpen ? (
                          <>
                            {dayObj.isEditingHours ? (
                              <div className="flex items-center gap-3">
                                <input
                                  type="time"
                                  value={dayObj.startTime}
                                  onChange={(e) => handleWorkingDayChange(dayName, "startTime", e.target.value)}
                                  required
                                  className="px-3 py-1 border border-gray-300 rounded text-sm bg-white focus:outline-none"
                                />
                                <span className="text-gray-400">to</span>
                                <input
                                  type="time"
                                  value={dayObj.endTime}
                                  onChange={(e) => handleWorkingDayChange(dayName, "endTime", e.target.value)}
                                  required
                                  className="px-3 py-1 border border-gray-300 rounded text-sm bg-white focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!dayObj.startTime || !dayObj.endTime) {
                                      Toast({ message: "Please specify both start and end times.", type: "warning" });
                                      return;
                                    }
                                    handleToggleWorkingDayHoursEdit(dayName, false);
                                  }}
                                  className="text-emerald-600 hover:text-emerald-800 transition-colors p-1"
                                  title="Save Working Hours"
                                >
                                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="px-3 py-1 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-700 font-medium">
                                  {formatTime12h(dayObj.startTime)}
                                </div>
                                <span className="text-gray-400">to</span>
                                <div className="px-3 py-1 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-700 font-medium">
                                  {formatTime12h(dayObj.endTime)}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleToggleWorkingDayHoursEdit(dayName, true)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors ml-2 p-1"
                                  title="Edit Working Hours"
                                >
                                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-gray-400 italic pr-8">Closed</span>
                        )}
                      </div>

                      {/* Day-Wise Breaks Editor Panel */}
                      {dayObj.isOpen && (
                        <div className="mt-3 pl-12 border-t border-gray-200 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700">Breaks for {dayName}</span>
                            <button
                              type="button"
                              onClick={() => handleAddDayBreak(dayName)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                            >
                              + Add Break
                            </button>
                          </div>

                          <div className="flex flex-col gap-2">
                            {(!dayObj.breakTimes || dayObj.breakTimes.length === 0) ? (
                              <span className="text-xs text-gray-400 italic">No breaks configured for this day.</span>
                            ) : (
                              dayObj.breakTimes.map((brk, bIdx) => (
                                <div key={bIdx}>
                                  {brk.isEditing ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={brk.name}
                                        onChange={(e) => handleDayBreakChange(dayName, bIdx, "name", e.target.value)}
                                        placeholder="Break Name (e.g. Lunch)"
                                        required
                                        className="px-3 py-0.5 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:border-blue-500 w-44"
                                      />
                                      <input
                                        type="time"
                                        value={brk.startTime}
                                        onChange={(e) => handleDayBreakChange(dayName, bIdx, "startTime", e.target.value)}
                                        required
                                        className="px-2 py-0.5 border border-gray-300 rounded text-xs bg-white focus:outline-none"
                                      />
                                      <span className="text-gray-400 text-xs">to</span>
                                      <input
                                        type="time"
                                        value={brk.endTime}
                                        onChange={(e) => handleDayBreakChange(dayName, bIdx, "endTime", e.target.value)}
                                        required
                                        className="px-2 py-0.5 border border-gray-300 rounded text-xs bg-white focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (brk.name.trim() === "" || !brk.startTime || !brk.endTime) {
                                            Toast({ message: "Please fill out all break fields.", type: "warning" });
                                            return;
                                          }
                                          handleToggleBreakEdit(dayName, bIdx, false);
                                        }}
                                        className="text-emerald-600 hover:text-emerald-800 transition-colors p-1"
                                        title="Save Break"
                                      >
                                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveDayBreak(dayName, bIdx)}
                                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                                        title="Delete Break"
                                      >
                                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-3 py-1 bg-white px-3 border border-gray-200 rounded text-xs text-gray-700 w-fit">
                                      <span className="font-semibold">{brk.name}</span>
                                      <span className="text-gray-400">|</span>
                                      <span>{formatTime12h(brk.startTime)} - {formatTime12h(brk.endTime)}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleBreakEdit(dayName, bIdx, true)}
                                        className="text-blue-600 hover:text-blue-800 transition-colors ml-2"
                                        title="Edit Break"
                                      >
                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveDayBreak(dayName, bIdx)}
                                        className="text-red-500 hover:text-red-700 transition-colors"
                                        title="Delete Break"
                                      >
                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </form>
        )}
      </div>
    </>
  );
}
