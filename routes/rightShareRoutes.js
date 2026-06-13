const router = require("express").Router();
const { getRightShares } = require("../controllers/rightShareController");

router.get("/", getRightShares);

module.exports = router;
