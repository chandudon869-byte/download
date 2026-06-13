const router = require("express").Router();
const { getBonus } = require("../controllers/bonusController");

router.get("/", getBonus);

module.exports = router;
