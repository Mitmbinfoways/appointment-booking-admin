"use client";

import React, { useState, useEffect, use } from "react";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import Button from "@/components/UI/Button";
import { getAdminSlotSettingsSuper, updateAdminSlotSettingsSuper } from "@/config/AxiosConfig";
import { Toast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import {
  parseTimeToMinutes,
  isTimeInsideInterval,
  checkOverlap,
  getBreakError,
  hasAnyBreakErrors
} from "@/utils/SlotValidation";

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
  const [isEditingNotice, setIsEditingNotice] = useState(false);
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);

  const [slotSettings, setSlotSettings] = useState({
    slotDurationMinutes: 30,
    minAdvanceNoticeMinutes: 0,
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
          slotDurationMinutes: res.data.data.slotDurationMinutes || 30,
          minAdvanceNoticeMinutes: res.data.data.minAdvanceNoticeMinutes || 0,
          capacityPerSlot: res.data.data.capacityPerSlot || 1,
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

  const saveSlotSettings = async (updatedSettings, shouldRedirect = false, customSuccessMessage = null) => {
    if (hasAnyBreakErrors(updatedSettings)) {
      Toast({ message: "Please resolve all overlapping break times before saving.", type: "error" });
      return;
    }
    setIsSaving(true);
    try {
      const cleanedWorkingDays = updatedSettings.workingDays.map((day) => ({
        day: day.day,
        isOpen: day.isOpen,
        startTime: day.startTime,
        endTime: day.endTime,
        breakTimes: (day.breakTimes || [])
          .filter(brk => brk.startTime && brk.endTime && !(brk.startTime === "00:00" && brk.endTime === "00:00"))
          .map(({ name, startTime, endTime }) => ({
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
        Toast({ message: customSuccessMessage || "Slot settings synced successfully.", type: "success" });

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
          minAdvanceNoticeMinutes: res.data.data.minAdvanceNoticeMinutes,
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
              {
                name: `Break ${((d.breakTimes || []).length + 1)}`,
                startTime: "",
                endTime: "",
                isEditing: true,
              }
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
    saveSlotSettings(nextSettings, false, "Break deleted successfully.");
  };

  const handleDayBreakChange = (dayName, breakIndex, field, value) => {
    const targetDay = slotSettings.workingDays.find((d) => d.day === dayName);
    if (!targetDay) return;

    const currentBreak = targetDay.breakTimes?.[breakIndex];
    if (!currentBreak) return;

    let newValue = value;

    if (field === "startTime" && value) {
      const s1 = parseTimeToMinutes(value);
      const hasEndTime = !!currentBreak.endTime;
      const e1 = hasEndTime ? parseTimeToMinutes(currentBreak.endTime) : null;

      if (hasEndTime && s1 >= e1) {
        Toast({ 
          message: s1 === e1 ? "Start time and End time cannot be the same." : "Start time cannot be after End time.", 
          type: "error" 
        });
        newValue = "";
      } else {
        const other = (targetDay.breakTimes || []).find((b, idx) => {
          if (idx === breakIndex || !b.startTime || !b.endTime) return false;
          const s2 = parseTimeToMinutes(b.startTime);
          const e2 = parseTimeToMinutes(b.endTime);
          return hasEndTime ? checkOverlap(s1, e1, s2, e2) : isTimeInsideInterval(s1, s2, e2);
        });

        if (other) {
          Toast({ 
            message: `This break overlaps with ${other.name || `Break`}.`, 
            type: "error" 
          });
          newValue = "";
        }
      }
    }

    setSlotSettings((prev) => ({
      ...prev,
      workingDays: prev.workingDays.map((d) => {
        if (d.day === dayName) {
          const updatedBreaks = (d.breakTimes || []).map((b, idx) =>
            idx === breakIndex ? { ...b, [field]: newValue } : b
          );
          return { ...d, breakTimes: updatedBreaks };
        }
        return d;
      }),
    }));
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
      saveSlotSettings(nextSettings, false, "Break saved successfully.");
    }
  };

  const isCapacityInvalid = slotSettings.capacityPerSlot === "" || slotSettings.capacityPerSlot === null || isNaN(Number(slotSettings.capacityPerSlot)) || Number(slotSettings.capacityPerSlot) < 1;

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

      <div className="bg-white rounded-lg border border-gray-200 shadow-theme-xs p-6">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700">
                    Slot Duration (Minutes)
                  </label>
                  {!isEditingDuration ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingDuration(true)}
                      className="h-6 text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 focus:outline-none"
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
                      className="h-6 px-2.5 text-xs text-white bg-green-600 hover:bg-green-700 font-semibold rounded transition-all duration-150 flex items-center gap-1 focus:outline-none cursor-pointer shadow-sm"
                      title="Save Slot Duration"
                    >
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

              {/* Minimum Advance Notice (Minutes) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700">
                    Minimum Advance Notice (Minutes)
                  </label>
                  {!isEditingNotice ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingNotice(true)}
                      className="h-6 text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 focus:outline-none"
                      title="Edit Minimum Advance Notice"
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
                        setIsEditingNotice(false);
                        saveSlotSettings(slotSettings, false);
                      }}
                      className="h-6 px-2.5 text-xs text-white bg-green-600 hover:bg-green-700 font-semibold rounded transition-all duration-150 flex items-center gap-1 focus:outline-none cursor-pointer shadow-sm"
                      title="Save Minimum Advance Notice"
                    >
                      Save
                    </button>
                  )}
                </div>

                {!isEditingNotice ? (
                  <div className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 font-medium flex items-center justify-between">
                    <span>
                      {slotSettings.minAdvanceNoticeMinutes > 0
                        ? formatDurationLabel(slotSettings.minAdvanceNoticeMinutes)
                        : "0 Minutes (Immediate)"}
                    </span>
                    <span className="text-xs text-gray-400">({slotSettings.minAdvanceNoticeMinutes || 0} mins)</span>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <select
                      value={[0, 15, 30, 45, 60, 90, 120].includes(slotSettings.minAdvanceNoticeMinutes) ? slotSettings.minAdvanceNoticeMinutes : "custom"}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== "custom") {
                          handleSlotSettingsChange("minAdvanceNoticeMinutes", Number(val));
                        }
                      }}
                      className="w-full px-4 py-2 border border-blue-500 rounded-lg text-sm bg-white text-gray-800 focus:outline-none"
                    >
                      <option value={0}>0 Minutes (Immediate Booking)</option>
                      <option value={15}>15 Minutes Notice</option>
                      <option value={30}>30 Minutes Notice</option>
                      <option value={45}>45 Minutes Notice</option>
                      <option value={60}>60 Minutes (1 Hour Notice)</option>
                      <option value={90}>90 Minutes (1.5 Hours Notice)</option>
                      <option value={120}>120 Minutes (2 Hours Notice)</option>
                      <option value="custom">Custom Minutes...</option>
                    </select>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs font-semibold text-gray-600">Custom Minutes:</span>
                      <input
                        type="number"
                        min={0}
                        value={slotSettings.minAdvanceNoticeMinutes || 0}
                        onChange={(e) => handleSlotSettingsChange("minAdvanceNoticeMinutes", Math.max(0, Number(e.target.value)))}
                        className="w-28 p-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-800 focus:outline-none focus:border-blue-500 font-semibold"
                        placeholder="e.g. 15, 30"
                      />
                      <span className="text-xs text-blue-600 font-medium">
                        {formatDurationLabel(slotSettings.minAdvanceNoticeMinutes)}
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
                      className="h-6 text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 focus:outline-none"
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
                      disabled={isCapacityInvalid}
                      onClick={() => {
                        setIsEditingCapacity(false);
                        saveSlotSettings(slotSettings, false);
                      }}
                      className={`h-6 px-2.5 text-xs font-semibold rounded transition-all duration-150 flex items-center gap-1 focus:outline-none shadow-sm ${isCapacityInvalid
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                          : "text-white bg-green-600 hover:bg-green-700 cursor-pointer"
                        }`}
                      title="Save Capacity"
                    >
                      Save
                    </button>
                  )}
                </div>

                {!isEditingCapacity ? (
                  <div className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 font-medium">
                    {slotSettings.capacityPerSlot}
                  </div>
                ) : (
                  <div>
                    <input
                      type="number"
                      min={1}
                      required
                      value={slotSettings.capacityPerSlot}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleSlotSettingsChange("capacityPerSlot", val === "" ? "" : Number(val));
                      }}
                      className="w-full px-4 py-2 border border-blue-500 rounded-lg text-sm bg-white text-gray-800 focus:outline-none"
                    />
                    {isCapacityInvalid && (
                      <p className="mt-1 text-xs text-red-500 font-semibold">
                        Capacity must be at least 1
                      </p>
                    )}
                  </div>
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
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${dayObj.isOpen ? "bg-blue-600" : "bg-gray-200"
                              }`}
                          >
                            <span className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${dayObj.isOpen ? "translate-x-4" : "translate-x-0"
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
                                  onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                                  required
                                  className="px-3 py-1 border border-gray-300 rounded text-sm bg-white focus:outline-none"
                                />
                                <span className="text-gray-400">to</span>
                                <input
                                  type="time"
                                  value={dayObj.endTime}
                                  onChange={(e) => handleWorkingDayChange(dayName, "endTime", e.target.value)}
                                  onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
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
                                    <div className="flex flex-col gap-1 w-fit">
                                      <div className="flex items-center gap-2 bg-white px-3 py-1 border border-gray-300 rounded shadow-sm">
                                        <input
                                          type="text"
                                          value={brk.name}
                                          onChange={(e) => handleDayBreakChange(dayName, bIdx, "name", e.target.value)}
                                          placeholder="Break Name (e.g. Lunch)"
                                          required
                                          className="px-2 py-0.5 border border-gray-300 rounded text-xs bg-white focus:outline-none w-24 text-gray-800 font-semibold"
                                        />
                                        <input
                                          type="time"
                                          value={brk.startTime}
                                          onChange={(e) => handleDayBreakChange(dayName, bIdx, "startTime", e.target.value)}
                                          onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                                          required
                                          className="px-2 py-0.5 border border-gray-300 rounded text-xs bg-white focus:outline-none"
                                        />
                                        <span className="text-gray-400 text-xs">to</span>
                                        <input
                                          type="time"
                                          value={brk.endTime}
                                          onChange={(e) => handleDayBreakChange(dayName, bIdx, "endTime", e.target.value)}
                                          onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                                          required
                                          className="px-2 py-0.5 border border-gray-300 rounded text-xs bg-white focus:outline-none"
                                        />
                                        <button
                                          type="button"
                                          disabled={!!getBreakError(brk, bIdx, dayObj.breakTimes)}
                                          onClick={() => {
                                            if (brk.name.trim() === "" || !brk.startTime || !brk.endTime || (brk.startTime === "00:00" && brk.endTime === "00:00")) {
                                              Toast({ message: "Please set a valid break duration.", type: "warning" });
                                              return;
                                            }
                                            handleToggleBreakEdit(dayName, bIdx, false);
                                          }}
                                          className="text-emerald-600 hover:text-emerald-800 transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed"
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
                                      {(() => {
                                        const error = getBreakError(brk, bIdx, dayObj.breakTimes);
                                        return error ? (
                                          <span className="text-[10px] text-red-500 font-semibold pl-1">
                                            {error}
                                          </span>
                                        ) : null;
                                      })()}
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
