require("dotenv").config(); // IMPORTANT (local dev support)

const app = require("./app");
const { startCron } = require("./jobs/cronJob");
const { ensureSchema } = require("./db/ensureSchema");
const { syncAllEvents } = require("./services/syncService");

const PORT = process.env.PORT || 3000;

async function startServer() {
  console.log("🚀 Starting server initialization...");

  try {
    // 🔥 Debug: check if Render is passing DB URL
    console.log(
      "DATABASE_URL:",
      process.env.DATABASE_URL ? "Loaded ✅" : "Missing ❌"
    );

    // If DB is missing, stop early (prevents silent failures)
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set in environment variables");
    }

    console.log("⏳ Initializing database schema...");
    
    // Ensure schema is created BEFORE starting server
    await ensureSchema();
    
    console.log("✅ Schema initialization COMPLETE - all tables ready");
    
    // Small delay to ensure schema is fully committed
    await new Promise(resolve => setTimeout(resolve, 500));

    // 🔄 SYNC DATA ON STARTUP
    console.log("🔄 Syncing NEPSE data on startup...");
    try {
      const syncResult = await syncAllEvents();
      console.log("✅ Startup Sync Complete:", syncResult);
    } catch (syncErr) {
      console.warn("⚠️ Startup sync failed (non-fatal):", syncErr.message);
    }
    
  } catch (err) {
    console.error("❌ FATAL: Schema initialization failed:", err.message);
    console.error("❌ Full error:", err);
    process.exit(1); // Exit if schema creation fails
  }

  app.listen(PORT, () => {
    console.log("🚀 Server running on port", PORT);
    console.log("✅ Ready to accept requests");
    startCron();
  });
}

startServer();
