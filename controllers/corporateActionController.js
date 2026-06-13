const { getCorporateActionRows } = require("../services/corporateActionService");

const CORPORATE_ACTION_TYPES = ["BONUS", "DIVIDEND", "RIGHT_SHARE", "AGM"];

async function getCorporateActions(req, res) {
  try {
    const rows = await getCorporateActionRows(CORPORATE_ACTION_TYPES);

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
  getCorporateActions,
};
