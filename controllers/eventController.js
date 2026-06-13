const pool = require("../db/pool");

async function getEvents(req, res) {
  try {
    const { type } = req.query;

    let query = "SELECT * FROM stock_events ORDER BY date DESC";
    let values = [];

    if (type) {
      query = "SELECT * FROM stock_events WHERE UPPER(type) = UPPER($1) ORDER BY date DESC";
      values = [type];
    }

    const result = await pool.query(query, values);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { getEvents };
