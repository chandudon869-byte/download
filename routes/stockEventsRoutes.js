const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM stock_events ORDER BY id DESC"
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
