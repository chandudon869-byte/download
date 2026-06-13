const pool = require("../db/pool");

async function getCalendar(req, res) {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM stock_events
      ORDER BY date
      `
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

module.exports = {
  getCalendar,
};