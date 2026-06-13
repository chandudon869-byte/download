const { scrapeStockEvents } = require("./scrapers/ipoScraper");

(async () => {
  try {
    const data = await scrapeStockEvents(
      "2026-06-01",
      "2026-06-10"
    );

    console.log("FINAL OUTPUT:");
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Test error:", err.message);
  }
})();