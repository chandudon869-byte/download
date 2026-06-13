/**
 * Normalize dates from merolagani response
 * Ensures consistency between source data and API response
 */

function parseDate(dateStr) {
  if (!dateStr) return null;

  // If already a Date object
  if (dateStr instanceof Date) {
    return dateStr.toISOString().split('T')[0];
  }

  // Convert to string and trim
  let str = String(dateStr).trim();
  
  // Handle "DD/MM/YYYY" format (common from merolagani)
  const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy;
    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  // Handle "YYYY-MM-DD" format
  const ymd = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const [, year, month, day] = ymd;
    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  // Handle "MM/DD/YYYY" format
  const mdy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const [, month, day, year] = mdy;
    // Ambiguous, but try parsing
    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  // Try generic Date parsing
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  return null;
}

function extractEventDateFromMerolagani(raw = {}) {
  // Try all possible date fields from merolagani response
  const candidates = [
    raw.date,
    raw.actionDate,
    raw.announcementDate,
    raw.open_date,
    raw.openDate,
    raw.bookClosureDate,
    raw.closureDate,
    raw.startDate,
    raw.endDate,
    raw.publishedDate,
    raw.publishDate,
    raw.newsDate,
    raw.eventDate,
    raw.announcementDetailDate
  ];

  for (const candidate of candidates) {
    const parsed = parseDate(candidate);
    if (parsed) return parsed;
  }

  return null;
}

module.exports = {
  parseDate,
  extractEventDateFromMerolagani
};
