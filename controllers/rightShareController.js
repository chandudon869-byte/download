const { getCorporateActionRows } = require("../services/corporateActionService");

async function getRightShares(req, res) {
  try {
    const rows = await getCorporateActionRows(["RIGHT_SHARE"]);

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
  getRightShares,
};
