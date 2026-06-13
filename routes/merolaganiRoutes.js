const express = require("express");
const router = express.Router();
const {
  fetchMerolaganiStockEvents,
  getCurrentMonthRange,
} = require("../services/merolaganiService");

/**
 * GET /api/merolagani/stock-events
 * Fetch and mirror stock events from merolagani.com
 * 
 * Query Parameters:
 *   - fromDate: Start date (format: M/D/YYYY) - optional, defaults to 1st of current month
 *   - toDate: End date (format: M/D/YYYY) - optional, defaults to last day of current month
 * 
 * Example: /api/merolagani/stock-events?fromDate=6/1/2026&toDate=6/30/2026
 */
router.get("/stock-events", async (req, res) => {
  try {
    let { fromDate, toDate } = req.query;

    // Use current month range if dates not provided
    if (!fromDate || !toDate) {
      const dateRange = getCurrentMonthRange();
      fromDate = fromDate || dateRange.fromDate;
      toDate = toDate || dateRange.toDate;
    }

    // Validate date format
    if (!isValidDateFormat(fromDate) || !isValidDateFormat(toDate)) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format. Use M/D/YYYY or MM/DD/YYYY",
        example: "/api/merolagani/stock-events?fromDate=6/1/2026&toDate=6/30/2026",
      });
    }

    console.log(
      `🔄 Fetching Merolagani data for range: ${fromDate} to ${toDate}`
    );
    const data = await fetchMerolaganiStockEvents(fromDate, toDate);

    res.json({
      success: true,
      source: "merolagani.com",
      dateRange: {
        from: fromDate,
        to: toDate,
      },
      count: data.length || 0,
      data: data,
    });
  } catch (error) {
    console.error("❌ Error in stock-events endpoint:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to fetch Merolagani data",
    });
  }
});

/**
 * Helper function to validate date format
 */
function isValidDateFormat(dateStr) {
  // Accept both M/D/YYYY and MM/DD/YYYY
  const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
  if (!dateRegex.test(dateStr)) return false;

  const [month, day, year] = dateStr.split("/").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000)
    return false;

  return true;
}

module.exports = router;
