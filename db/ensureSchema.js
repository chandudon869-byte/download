const pool = require("./pool");

async function ensureSchema() {
  try {
    console.log("📋 Creating/checking status_rank function...");
    await pool.query(`
      CREATE OR REPLACE FUNCTION status_rank(status TEXT)
      RETURNS INT AS $$
      BEGIN
        RETURN CASE
          WHEN status = 'UPCOMING' THEN 1
          WHEN status = 'OPEN' THEN 2
          WHEN status = 'CLOSED' THEN 3
          ELSE 0
        END;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log("✅ status_rank function created");
  } catch (err) {
    console.error("⚠️ status_rank creation failed:", err.message);
  }

  try {
    console.log("📋 Creating/checking upcoming_ipos table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS upcoming_ipos (
        id SERIAL PRIMARY KEY,
        company_name TEXT,
        symbol TEXT,
        shares NUMERIC DEFAULT 0,
        issue_size NUMERIC DEFAULT 0,
        issue_type TEXT,
        event_value JSONB,
        status TEXT,
        source TEXT,
        source_url TEXT,
        confidence NUMERIC DEFAULT 0,
        open_date DATE,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✅ upcoming_ipos table created");
  } catch (err) {
    console.error("⚠️ upcoming_ipos creation failed:", err.message);
  }

  try {
    console.log("📋 Adding columns to upcoming_ipos...");
    await pool.query(`
      ALTER TABLE upcoming_ipos
        ADD COLUMN IF NOT EXISTS shares NUMERIC DEFAULT 0,
        ADD COLUMN IF NOT EXISTS issue_size NUMERIC DEFAULT 0,
        ADD COLUMN IF NOT EXISTS issue_type TEXT,
        ADD COLUMN IF NOT EXISTS event_value JSONB,
        ADD COLUMN IF NOT EXISTS status TEXT,
        ADD COLUMN IF NOT EXISTS source TEXT,
        ADD COLUMN IF NOT EXISTS source_url TEXT,
        ADD COLUMN IF NOT EXISTS confidence NUMERIC DEFAULT 0,
        ADD COLUMN IF NOT EXISTS open_date DATE,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
    `);
    console.log("✅ upcoming_ipos columns added");
  } catch (err) {
    console.error("⚠️ upcoming_ipos column addition failed:", err.message);
  }

  try {
    console.log("📋 Creating index for upcoming_ipos...");
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS upcoming_ipos_company_issue_source_idx
      ON upcoming_ipos (company_name, issue_type, source)
    `);
    console.log("✅ upcoming_ipos index created");
  } catch (err) {
    console.error("⚠️ upcoming_ipos index creation failed:", err.message);
  }

  // Create stock_events table
  try {
    console.log("📋 Creating/checking stock_events table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_events (
        id SERIAL PRIMARY KEY,
        company_name TEXT,
        symbol TEXT,
        type TEXT,
        date DATE,
        status TEXT,
        source TEXT,
        source_url TEXT,
        confidence NUMERIC DEFAULT 0,
        event_value JSONB,
        announcement TEXT,
        shares NUMERIC DEFAULT 0,
        issue_size NUMERIC DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✅ stock_events table created");
  } catch (err) {
    console.error("⚠️ stock_events creation failed:", err.message);
  }

  try {
    console.log("📋 Creating index for stock_events...");
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS stock_events_unique_idx
      ON stock_events (company_name, type, date)
    `);
    console.log("✅ stock_events index created");
  } catch (err) {
    console.error("⚠️ stock_events index creation failed:", err.message);
  }

  console.log("✅ Schema initialization complete!");
}

module.exports = { ensureSchema };
