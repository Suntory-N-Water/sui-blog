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

export function postDate(data: {
  modified_time?: string | Date;
  publishedAt?: Date | null;
}): Date | null {
  if (data.modified_time) {
    const parsed =
      data.modified_time instanceof Date
        ? data.modified_time
        : new Date(data.modified_time);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return data.publishedAt ?? null;
}

export function getYear(date: Date | null | undefined) {
  if (!date) {
    return null;
  }
  return partsOf(date).year;
}
