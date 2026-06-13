const axios = require("axios");
const { CookieJar } = require("tough-cookie");
const axiosCookieJarSupport = require("axios-cookiejar-support").default;

// Enable cookie jar support
axiosCookieJarSupport(axios);

const cookieJar = new CookieJar();

const baseURL = "https://merolagani.com/handlers";

/**
 * Fetch stock events from merolagani.com
 * @param {string} fromDate - Start date (format: M/D/YYYY or MM/DD/YYYY)
 * @param {string} toDate - End date (format: M/D/YYYY or MM/DD/YYYY)
 * @returns {Promise<Array>} Array of stock events
 */
async function fetchMerolaganiStockEvents(fromDate, toDate) {
  try {
    console.log(`📥 Fetching Merolagani stock events from ${fromDate} to ${toDate}...`);

    const response = await axios.get(
      `${baseURL}/webrequesthandler.ashx`,
      {
        params: {
          type: "stock_event",
          fromDate: fromDate,
          toDate: toDate,
        },
        jar: cookieJar,
        withCredentials: true,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json, text/plain, */*",
          Referer: "https://merolagani.com/",
        },
        timeout: 10000,
      }
    );

    console.log(`✅ Successfully fetched ${response.data?.length || 0} events from Merolagani`);
    return response.data || [];
  } catch (error) {
    console.error("❌ Error fetching from Merolagani:", error.message);
    throw new Error(`Failed to fetch Merolagani data: ${error.message}`);
  }
}

/**
 * Get current month's date range
 * @returns {Object} { fromDate, toDate } in M/D/YYYY format
 */
function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  
  const fromDate = `${month + 1}/1/${year}`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const toDate = `${month + 1}/${lastDay}/${year}`;
  
  return { fromDate, toDate };
}

module.exports = {
  fetchMerolaganiStockEvents,
  getCurrentMonthRange,
};
