const router = require("express").Router();
const { getAgms } = require("../controllers/agmController");

router.get("/", getAgms);

module.exports = router;
