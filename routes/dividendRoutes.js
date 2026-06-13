const router = require("express").Router();
const {
  getDividends,
} = require("../controllers/dividendController");

router.get("/", getDividends);

module.exports = router;