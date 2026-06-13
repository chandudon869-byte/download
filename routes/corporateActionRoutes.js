const router = require("express").Router();

const {
  getCorporateActions,
} = require("../controllers/corporateActionController");
const { getBonus } = require("../controllers/bonusController");
const { getDividends } = require("../controllers/dividendController");
const { getRightShares } = require("../controllers/rightShareController");
const { getAgms } = require("../controllers/agmController");

router.get("/", getCorporateActions);
router.get("/bonus", getBonus);
router.get("/dividend", getDividends);
router.get("/right-share", getRightShares);
router.get("/rights", getRightShares);
router.get("/agm", getAgms);

module.exports = router;
