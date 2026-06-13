const cron = require("node-cron");
const { syncAllEvents } = require("../services/syncService");

let isRunning = false;

function startCron() {
  console.log("📡 NEPSE Cron Started...");

  cron.schedule(
    "0 */3 * * *",
    async () => {
      if (isRunning) return;

      isRunning = true;

      try {
        console.log("🔄 Syncing NEPSE data...");

        const result = await syncAllEvents();

        console.log("✅ Sync Complete:", result);
      } catch (err) {
        console.error("❌ Sync failed:", err);
      } finally {
        isRunning = false;
      }
    },
    { timezone: "Asia/Kathmandu" }
  );
}

module.exports = { startCron };