const cron = require("node-cron");
const axios = require("axios");
const { syncAnnouncements } = require("../services/syncService");

let running = false;

function startCron() {
  cron.schedule("0 */3 * * *", async () => {
    if (running) return;

    running = true;

    try {
      const res = await axios.get(
        "YOUR_MEROLAGANI_API"
      );

      await syncAnnouncements(res.data);

      console.log("✅ Sync complete");
    } catch (err) {
      console.error(err.message);
    }

    running = false;
  });
}

module.exports = { startCron };