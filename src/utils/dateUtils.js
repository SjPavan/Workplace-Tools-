const MS_IN_DAY = 24 * 60 * 60 * 1000;

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const toISODate = (value) => {
  const date = toDate(value);
  if (!date) return null;
  return date.toISOString().slice(0, 10);
};

const differenceInDays = (target, base = new Date()) => {
  const targetDate = toDate(target);
  const baseDate = toDate(base);
  if (!targetDate || !baseDate) return null;
  const diffMs = targetDate.setHours(0, 0, 0, 0) - baseDate.setHours(0, 0, 0, 0);
  return Math.round(diffMs / MS_IN_DAY);
};

const isSameDay = (a, b) => {
  const isoA = toISODate(a);
  const isoB = toISODate(b);
  return isoA !== null && isoA === isoB;
};

const isWithinNextDays = (value, base = new Date(), range = 1) => {
  const diff = differenceInDays(value, base);
  if (diff === null) return false;
  return diff >= 0 && diff <= range;
};

module.exports = {
  toDate,
  toISODate,
  differenceInDays,
  isSameDay,
  isWithinNextDays
};
