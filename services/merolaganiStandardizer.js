/**
 * Merolagani Data Standardizer
 * Fetches raw data from merolagani and converts to standardized format
 * matching the API response structure
 */

const axios = require("axios");
const cheerio = require("cheerio");

let client = axios.create({
  timeout: 15000
});

try {
  const { wrapper } = require("axios-cookiejar-support");
  const { CookieJar } = require("tough-cookie");

  const jar = new CookieJar();
  client = wrapper(
    axios.create({
      jar,
      withCredentials: true,
      timeout: 15000
    })
  );
} catch (err) {
  console.warn("axios-cookiejar-support not available; using plain axios");
}

/**
 * Fetch raw data from Merolagani API
 */
async function fetchFromMerolagani(fromDate, toDate) {
  try {
    const url = "https://www.merolagani.com/handlers/webrequesthandler.ashx";
    
    // Format: MM/DD/YYYY (e.g., 06/01/2026)
    const params = {
      type: "stock_event",
      fromDate: formatDateForMerolagani(fromDate),
      toDate: formatDateForMerolagani(toDate)
    };

    console.log(`🔍 Fetching Merolagani data from ${params.fromDate} to ${params.toDate}`);

    // Establish session first
    await client.get("https://merolagani.com/", {
      timeout: 10000
    });

    // Fetch data
    const { data } = await client.get(url, {
      params,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json, text/plain, */*",
        Referer: "https://merolagani.com/",
        "X-Requested-With": "XMLHttpRequest"
      },
      timeout: 10000
    });

    console.log(`✅ Successfully fetched ${JSON.stringify(data).length} bytes from Merolagani`);
    return data;
  } catch (err) {
    console.error("❌ Error fetching from Merolagani:", err.message);
    return [];
  }
}

/**
 * Format date for Merolagani API (MM/DD/YYYY)
 */
function formatDateForMerolagani(d) {
  const date = new Date(d);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${m}/${day}/${year}`;
}

/**
 * Parse raw Merolagani response - handles various data structures
 */
function parseMerolaganiResponse(data) {
  if (Array.isArray(data)) return data;

  if (data && typeof data === "object") {
    // Try common wrapper keys
    for (const key of ["data", "d", "result", "Data", "detail", "details"]) {
      if (Array.isArray(data[key])) return data[key];
    }
  }

  if (typeof data === "string") {
    const trimmed = data.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      return parseMerolaganiResponse(parsed);
    } catch (err) {
      console.warn("⚠️ Could not parse as JSON, attempting HTML parse");
      return [];
    }
  }

  return [];
}

/**
 * Standardize single Merolagani record to common format
 */
function standardizeRecord(record) {
  if (!record || typeof record !== "object") {
    return null;
  }

  // Extract dates safely
  const eventDate = parseDate(
    record.EventDate ||
    record.eventDate ||
    record.date ||
    record.actionDate
  );

  const bookCloseDate = parseDate(
    record.BookCloseDate ||
    record.bookCloseDate ||
    record.closureDate
  );

  // Extract company and symbol
  const companyName = String(record.CompanyName || record.companyName || "")
    .trim();
  const symbol = String(record.Symbol || record.symbol || "")
    .trim()
    .toUpperCase();

  // Extract event type
  const eventType = String(record.EventType || record.eventType || "")
    .trim()
    .toUpperCase();

  // Details/announcement
  const details = String(
    record.Details ||
    record.details ||
    record.EventTitle ||
    record.eventTitle ||
    record.announcement ||
    ""
  ).trim();

  return {
    // Standardized fields
    id: record.Id || record.id || null,
    company_name: companyName,
    symbol: symbol || "UNKNOWN",
    event_type: normalizeEventType(eventType),
    event_title: String(record.EventTitle || record.eventTitle || "").trim(),
    event_date: eventDate,
    book_close_date: bookCloseDate,
    details: details,
    venue: String(record.Venue || record.venue || "").trim(),
    time: String(record.Time || record.time || "").trim(),
    posted_on: parseDate(record.PostedOn || record.postedOn),
    
    // Original data (for debugging)
    _raw: record,
    source: "merolagani",
    source_url: "https://merolagani.com"
  };
}

/**
 * Parse various date formats
 */
function parseDate(dateStr) {
  if (!dateStr) return null;

  if (dateStr instanceof Date) {
    return dateStr.toISOString().split("T")[0];
  }

  let str = String(dateStr).trim();

  // DD/MM/YYYY
  const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const date = new Date(dmy[3], dmy[2] - 1, dmy[1]);
    if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];
  }

  // YYYY-MM-DD
  const ymd = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const date = new Date(ymd[1], ymd[2] - 1, ymd[3]);
    if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];
  }

  // ISO format with time
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }

  return null;
}

/**
 * Normalize event type to standard values
 */
function normalizeEventType(type) {
  const upper = String(type).toUpperCase();

  const typeMap = {
    "AGM": "AGM",
    "SGM": "SGM",
    "BOOKCLOSE": "BOOK_CLOSURE",
    "BOOK_CLOSURE": "BOOK_CLOSURE",
    "DIVIDEND": "DIVIDEND",
    "BONUS": "BONUS",
    "RIGHT": "RIGHT_SHARE",
    "RIGHTSHARE": "RIGHT_SHARE",
    "RIGHT_SHARE": "RIGHT_SHARE",
    "IPO": "IPO",
    "LISTING": "LISTING"
  };

  return typeMap[upper] || upper || "OTHER";
}

/**
 * Main function: Get all standardized data from Merolagani
 */
async function getAllMerolaganiData(fromDate, toDate) {
  try {
    // Default to 90 days if not specified
    if (!fromDate || !toDate) {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 90);
      fromDate = from;
      toDate = to;
    }

    // Fetch raw data
    const rawData = await fetchFromMerolagani(fromDate, toDate);

    // Parse response
    const records = parseMerolaganiResponse(rawData);
    console.log(`📊 Parsed ${records.length} records from Merolagani`);

    // Standardize each record
    const standardized = records
      .map(standardizeRecord)
      .filter(record => record !== null);

    console.log(`✅ Standardized ${standardized.length} records`);

    return {
      success: true,
      count: standardized.length,
      from_date: formatDateForMerolagani(fromDate),
      to_date: formatDateForMerolagani(toDate),
      data: standardized
    };
  } catch (err) {
    console.error("❌ Error in getAllMerolaganiData:", err.message);
    return {
      success: false,
      error: err.message,
      data: []
    };
  }
}

module.exports = {
  fetchFromMerolagani,
  parseMerolaganiResponse,
  standardizeRecord,
  parseDate,
  normalizeEventType,
  getAllMerolaganiData
};
