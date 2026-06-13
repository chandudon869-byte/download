const pool = require("../db/pool");

function serializeUpcomingIPO(row) {
  return {
    ...row,
    shares: Number(row.shares || 0),
    issue_size: Number(row.issue_size || 0),
  };
}

function serializeStockEvent(row) {
  return {
    company_name: row.company_name || "",
    symbol: row.symbol || "UNKNOWN",
    shares: Number(row.shares || 0),
    issue_size: Number(row.issue_size || 0),
    issue_type: row.type || "IPO",
    status: row.status || "Upcoming",
    source: row.source || "merolagani",
    source_url: row.source_url || "https://merolagani.com",
    confidence: Number(row.confidence || 0),
    event_value: row.event_value || null,
    open_date: row.date || null,
    announcement: row.announcement || "",
  };
}

async function getIPOs(req, res) {
  try {
    const upcomingResult = await pool.query(
      `
      SELECT *
      FROM upcoming_ipos
      ORDER BY updated_at DESC NULLS LAST, id DESC
      `
    );

    if (upcomingResult.rows.length > 0) {
      return res.json({
        success: true,
        count: upcomingResult.rows.length,
        data: upcomingResult.rows.map(serializeUpcomingIPO),
      });
    }

    const stockEventResult = await pool.query(
      `
      SELECT *
      FROM stock_events
      WHERE type = 'IPO'
      ORDER BY date DESC
      `
    );

    res.json({
      success: true,
      count: stockEventResult.rows.length,
      data: stockEventResult.rows.map(serializeStockEvent),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

module.exports = {
  getIPOs,
};// API controller here
