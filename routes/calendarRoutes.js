const router = require("express").Router();
const {
  getCalendar,
} = require("../controllers/calendarController");

router.get("/", getCalendar);

module.exports = router;