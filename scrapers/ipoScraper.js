const axios = require("axios");
const cheerio = require("cheerio");
const http = require("http");
const https = require("https");

// HTTP/HTTPS agents with connection pooling
const httpAgent = new http.Agent({ 
  keepAlive: true, 
  maxSockets: 5, 
  maxFreeSockets: 2,
  timeout: 30000 
});

const httpsAgent = new https.Agent({ 
  keepAlive: true, 
  maxSockets: 5, 
  maxFreeSockets: 2,
  timeout: 30000 
});

let client = axios.create({
  timeout: 30000,
  httpAgent,
  httpsAgent
});

try {
  const { wrapper } = require("axios-cookiejar-support");
  const { CookieJar } = require("tough-cookie");

  const jar = new CookieJar();
  client = wrapper(
    axios.create({
      jar,
      withCredentials: true,
      timeout: 30000,
      httpAgent,
      httpsAgent
    })
  );
} catch (err) {
  console.warn(
    "axios-cookiejar-support not available; falling back to plain axios client."
  );
}

function formatDate(d) {
  const date = new Date(d);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date passed to formatDate()");
  }

  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  return `${m}/${day}/${year}`;
}

function normalizeEventItem(item) {
  if (typeof item === "string") {
    return {
      announcementDetail: item,
      announcement: item,
      raw_text: item,
      source: "merolagani",
      source_url: "https://merolagani.com"
    };
  }

  const text =
    item?.announcementDetail ||
    item?.announcement ||
    item?.detail ||
    item?.title ||
    item?.text ||
    item?.message ||
    item?.event ||
    item?.description ||
    item?.raw_text ||
    item?.rawText ||
    item?.company_name ||
    "";

  return {
    ...item,
    announcementDetail: item?.announcementDetail || text,
    announcement: item?.announcement || text,
    raw_text: item?.raw_text || item?.rawText || text,
    source: item?.source || "merolagani",
    source_url: item?.source_url || item?.sourceUrl || "https://merolagani.com"
  };
}

function parseMaybeJson(data) {
  if (Array.isArray(data)) return data;

  if (data && typeof data === "object") {
    for (const key of ["data", "d", "result", "Data", "detail"]) {
      if (Array.isArray(data[key])) return data[key];
    }
  }

  if (typeof data === "string") {
    const trimmed = data.trim();
    if (!trimmed) return [];

    try {
      return parseMaybeJson(JSON.parse(trimmed));
    } catch (err) {
      if (trimmed.includes("<") && trimmed.includes(">")) {
        const $ = cheerio.load(trimmed);
        const rows = [];

        $("tr, li, .announcement, .news, .event, .card").each((_, el) => {
          const text = $(el).text().replace(/\s+/g, " ").trim();
          if (text.length >= 10) {
            rows.push(text);
          }
        });

        if (rows.length > 0) {
          return rows;
        }

        const bodyText = $("body").text().replace(/\s+/g, " ").trim();
        if (bodyText.length >= 10) {
          return [bodyText];
        }
      }

      const match = trimmed.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (!match) return [];

      try {
        return parseMaybeJson(JSON.parse(match[0]));
      } catch (jsonErr) {
        return [];
      }
    }
  }

  return [];
}

/**
 * Retry logic with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries}...`);
      return await fn();
    } catch (err) {
      lastError = err;
      const isTimeout = err.code === "ECONNABORTED" || err.code === "ETIMEDOUT" || err.code === "ENOTFOUND";
      const isNetworkError = err.code === "ECONNREFUSED" || err.code === "ENETUNREACH";
      
      // Only retry on network/timeout errors
      if (!isTimeout && !isNetworkError) {
        throw err; // Don't retry on other errors
      }
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(`⚠️ Timeout/Network error on attempt ${attempt}. Retrying in ${delay}ms...`);
        console.warn(`⚠️ Error: ${err.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed after ${maxRetries} retries: ${lastError?.message}`);
}

/**
 * Establish session with retry logic
 */
async function establishSession() {
  return retryWithBackoff(async () => {
    console.log("📡 Establishing session with merolagani.com...");
    await client.get("https://merolagani.com/", {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    console.log("✅ Session established successfully");
  }, 3, 2000);
}

async function scrapeStockEvents(fromDate, toDate) {
  try {
    if (!fromDate || !toDate) {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 90);

      fromDate = from;
      toDate = to;
    }

    const url = "https://www.merolagani.com/handlers/webrequesthandler.ashx";
    const params = {
      type: "stock_event",
      fromDate: formatDate(fromDate),
      toDate: formatDate(toDate)
    };

    console.log("🔍 Scraping from:", formatDate(fromDate), "to:", formatDate(toDate));

    // Establish session first with retry
    await establishSession();

    // Make API request with retry logic
    const { data } = await retryWithBackoff(async () => {
      console.log("📊 Fetching stock events from API...");
      return await client.get(url, {
        params,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
          Accept: "application/json, text/plain, */*",
          Referer: "https://merolagani.com/",
          "X-Requested-With": "XMLHttpRequest",
          Connection: "keep-alive"
        },
        timeout: 30000
      });
    }, 3, 2000);

    console.log("📊 Raw API response type:", typeof data);
    console.log("📊 Raw API response length:", JSON.stringify(data).length);
    console.log("📊 Raw API response (first 500 chars):", JSON.stringify(data).substring(0, 500));

    const list = parseMaybeJson(data).map(normalizeEventItem);
    console.log("✅ Parsed events count:", list.length);

    if (list.length > 0) {
      console.log("📝 Sample event:", list[0]);
    }

    return list;
  } catch (err) {
    console.error("❌ SCRAPER ERROR:", err.message);
    console.error("❌ Error code:", err.code);
    if (err.response) {
      console.error("❌ Response status:", err.response.status);
      console.error("❌ Response data (first 200 chars):", JSON.stringify(err.response.data).substring(0, 200));
    }
    return [];
  }
}

module.exports = {
  scrapeStockEvents,
  scrapeIPOs: scrapeStockEvents
};
