const MINUTES_IN_DAY = 24 * 60;

export function timeStringToMinutes(timeString) {
  if (!timeString || typeof timeString !== "string") {
    return null;
  }
  const [hours, minutes] = timeString.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
}

function getLocalTimeParts(date, timezone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit"
  });
  const parts = formatter.formatToParts(date);
  const mapped = parts.reduce((acc, part) => {
    if (part.type === "hour" || part.type === "minute") {
      acc[part.type] = Number(part.value);
    }
    return acc;
  }, {});
  return {
    hours: mapped.hour ?? 0,
    minutes: mapped.minute ?? 0
  };
}

export function getMinutesSinceMidnight(date, timezone = "UTC") {
  const { hours, minutes } = getLocalTimeParts(date, timezone);
  return hours * 60 + minutes;
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function isWithinQuietHours(date, quietHours = {}) {
  const { start, end, timezone = "UTC" } = quietHours;
  const startMinutes = timeStringToMinutes(start);
  const endMinutes = timeStringToMinutes(end);
  if (startMinutes == null || endMinutes == null) {
    return false;
  }
  const currentMinutes = getMinutesSinceMidnight(date, timezone);

  if (startMinutes === endMinutes) {
    return false; // quiet hours disabled
  }

  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export function getNextQuietHoursExit(date, quietHours = {}) {
  const { start, end, timezone = "UTC" } = quietHours;
  const startMinutes = timeStringToMinutes(start);
  const endMinutes = timeStringToMinutes(end);
  if (startMinutes == null || endMinutes == null) {
    return date instanceof Date ? date : new Date(date);
  }
  const currentMinutes = getMinutesSinceMidnight(date, timezone);

  if (!isWithinQuietHours(date, quietHours)) {
    return date;
  }

  if (startMinutes < endMinutes) {
    const diff = endMinutes - currentMinutes;
    return addMinutes(date, diff > 0 ? diff : MINUTES_IN_DAY + diff);
  }

  // Quiet hours span midnight
  if (currentMinutes < endMinutes) {
    const diff = endMinutes - currentMinutes;
    return addMinutes(date, diff);
  }

  const diff = MINUTES_IN_DAY - currentMinutes + endMinutes;
  return addMinutes(date, diff);
}

export function formatDateTime(date) {
  const value = date instanceof Date ? date : new Date(date);
  return value.toISOString();
}
