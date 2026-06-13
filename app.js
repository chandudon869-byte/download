const express = require("express");

const ipoRoutes = require("./routes/ipoRoutes");
const calendarRoutes = require("./routes/calendarRoutes");
const corporateActionRoutes = require("./routes/corporateActionRoutes");
const dividendRoutes = require("./routes/dividendRoutes");
const bonusRoutes = require("./routes/bonusRoutes");
const rightShareRoutes = require("./routes/rightShareRoutes");
const agmRoutes = require("./routes/agmRoutes");
const stockEventsRoutes = require("./routes/stockEventsRoutes");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "NEPSE API is running",
  });
});

app.get("/health", (req, res) => {
  res.json({ success: true });
});

app.use("/api/ipo", ipoRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/corporate-actions", corporateActionRoutes);
app.use("/api/dividend", dividendRoutes);
app.use("/api/bonus", bonusRoutes);
app.use("/api/right-share", rightShareRoutes);
app.use("/api/rights", rightShareRoutes);
app.use("/api/agm", agmRoutes);
app.use("/api/stock-events", stockEventsRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Not Found",
    availableRoutes: ["/", "/health", "/api/ipo", "/api/calendar", "/api/corporate-actions", "/api/dividend", "/api/bonus", "/api/right-share", "/api/rights", "/api/agm", "/api/stock-events"],
  });
});

module.exports = app;
