export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

export const isTimeInsideInterval = (t, start, end) =>
  start < end ? t >= start && t < end : t >= start || t < end;

export const checkOverlap = (s1, e1, s2, e2) =>
  isTimeInsideInterval(s1, s2, e2) || isTimeInsideInterval(s2, s1, e1);

export const getBreakError = (brk, bIdx, breakTimes) => {
  if (!brk.startTime || !brk.endTime) return null;
  const s1 = parseTimeToMinutes(brk.startTime);
  const e1 = parseTimeToMinutes(brk.endTime);

  if (s1 >= e1) {
    return s1 === e1
      ? "Start time and End time cannot be the same."
      : "Start time cannot be after End time.";
  }

  const other = breakTimes.find((b, idx) => {
    if (idx === bIdx || !b.startTime || !b.endTime) return false;
    return checkOverlap(
      s1,
      e1,
      parseTimeToMinutes(b.startTime),
      parseTimeToMinutes(b.endTime),
    );
  });

  return other
    ? `This break overlaps with ${other.name || "another break"}.`
    : null;
};

export const hasAnyBreakErrors = (settings) => {
  return settings.workingDays.some((day) => {
    if (!day.isOpen) return false;
    const activeBreaks = (day.breakTimes || []).filter(
      (brk) =>
        brk.startTime &&
        brk.endTime &&
        !(brk.startTime === "00:00" && brk.endTime === "00:00"),
    );
    return activeBreaks.some((brk, idx) => {
      return getBreakError(brk, idx, activeBreaks) !== null;
    });
  });
};
