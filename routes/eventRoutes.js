const router = require("express").Router();
const { getEvents } = require("../controllers/eventController");

router.get("/events", getEvents);

module.exports = router;