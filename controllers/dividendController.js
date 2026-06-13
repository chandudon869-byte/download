const { getCorporateActionRows } = require("../services/corporateActionService");

async function getDividends(req, res) {
  try {
    const rows = await getCorporateActionRows(["DIVIDEND"]);

    res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

module.exports = {
  getDividends,
};
