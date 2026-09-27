const TIME_ZONE = 'Asia/Tokyo';

const dateParts = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function partsOf(date: Date) {
  const found: Record<string, string> = {};
  for (const part of dateParts.formatToParts(date)) {
    found[part.type] = part.value;
  }
  return found;
}

export function formatIndexDate(date: Date | null | undefined) {
  if (!date) {
    return null;
  }
  const { year, month, day } = partsOf(date);
  return `${year}.${month}.${day}`;
}

export function formatYearMonthJp(date: Date | null | undefined) {
  if (!date) {
    return null;
  }
  const { year, month } = partsOf(date);
  return `${year}年${Number(month)}月`;
}

export function getYear(date: Date | null | undefined) {
  if (!date) {
    return null;
  }
  return partsOf(date).year;
}
