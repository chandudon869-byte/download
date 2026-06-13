const db = require("../db/pool");
const { scrapeStockEvents } = require("../scrapers/ipoScraper");
const { normalizeEvent } = require("./normalizeEvent");

function statusRankExpression(columnName) {
  return `
    CASE
      WHEN ${columnName} IN ('PENDING', 'UPCOMING') THEN 1
      WHEN ${columnName} IN ('OPEN', 'STARTED') THEN 2
      WHEN ${columnName} IN ('CLOSED', 'ENDED') THEN 3
      WHEN ${columnName} IN ('ALLOTTED', 'LISTED') THEN 4
      ELSE 0
    END
  `;
}

/**
 * MAIN SYNC PIPELINE
 */
async function syncAllEvents(fromDate, toDate) {
  const events = await scrapeStockEvents(fromDate, toDate);
  console.log("SCRAPED EVENTS:", events.length);
  let inserted = 0;

  for (const e of events) {
    const normalized = normalizeEvent(e);
    if (!normalized) continue;

    // ----------------------------
    // DB INSERT (SAFE UPSERT)
    // ----------------------------
    try {
      await db.query(
        `
        INSERT INTO upcoming_ipos
        (
          company_name,
          symbol,
          shares,
          issue_size,
          issue_type,
          event_value,
          status,
          source,
          source_url,
          confidence
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (company_name, issue_type, source)
        DO UPDATE SET
          symbol = CASE
            WHEN EXCLUDED.symbol <> 'UNKNOWN' THEN EXCLUDED.symbol
            WHEN upcoming_ipos.symbol IN ('LOCALS', 'PUBLIC', 'SHARES', 'SHARE', 'IPO', 'FPO', 'AGM', 'SGM') THEN 'UNKNOWN'
            ELSE upcoming_ipos.symbol
          END,
          shares = CASE
            WHEN EXCLUDED.shares > 0
              AND (${statusRankExpression("EXCLUDED.status")}) >= (${statusRankExpression("upcoming_ipos.status")})
              THEN EXCLUDED.shares
            WHEN COALESCE(upcoming_ipos.shares, 0) = 0 AND EXCLUDED.shares > 0 THEN EXCLUDED.shares
            ELSE upcoming_ipos.shares
          END,
          issue_size = CASE
            WHEN EXCLUDED.issue_size > 0
              AND (${statusRankExpression("EXCLUDED.status")}) >= (${statusRankExpression("upcoming_ipos.status")})
              THEN EXCLUDED.issue_size
            WHEN COALESCE(upcoming_ipos.issue_size, 0) = 0 AND EXCLUDED.issue_size > 0 THEN EXCLUDED.issue_size
            ELSE upcoming_ipos.issue_size
          END,
          issue_type = EXCLUDED.issue_type,
          event_value = CASE
            WHEN EXCLUDED.shares > 0
              AND (${statusRankExpression("EXCLUDED.status")}) >= (${statusRankExpression("upcoming_ipos.status")})
              THEN EXCLUDED.event_value
            WHEN COALESCE(upcoming_ipos.shares, 0) = 0 AND EXCLUDED.shares > 0 THEN EXCLUDED.event_value
            ELSE upcoming_ipos.event_value
          END,
          status = CASE
            WHEN (${statusRankExpression("EXCLUDED.status")}) >= (${statusRankExpression("upcoming_ipos.status")})
              THEN EXCLUDED.status
            ELSE upcoming_ipos.status
          END,
          source_url = EXCLUDED.source_url,
          confidence = GREATEST(
            COALESCE(upcoming_ipos.confidence, 0),
            COALESCE(EXCLUDED.confidence, 0)
          ),
          updated_at = NOW()
        `,
        [
          normalized.company_name,
          normalized.symbol,
          normalized.shares,
          normalized.issue_size,
          normalized.issue_type,
          JSON.stringify(normalized.event_value),
          normalized.status,
          normalized.source,
          normalized.source_url,
          normalized.confidence
        ]
      );

      await db.query(
        `
        INSERT INTO stock_events
        (
          company_name,
          symbol,
          type,
          date,
          status,
          source,
          source_url,
          confidence,
          event_value,
          announcement,
          shares,
          issue_size,
          updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
        ON CONFLICT (company_name, type, date)
        DO UPDATE SET
          symbol = EXCLUDED.symbol,
          status = EXCLUDED.status,
          source = EXCLUDED.source,
          source_url = EXCLUDED.source_url,
          confidence = GREATEST(COALESCE(stock_events.confidence, 0), COALESCE(EXCLUDED.confidence, 0)),
          event_value = EXCLUDED.event_value,
          announcement = EXCLUDED.announcement,
          shares = EXCLUDED.shares,
          issue_size = EXCLUDED.issue_size,
          updated_at = NOW()
        `,
        [
          normalized.company_name,
          normalized.symbol,
          normalized.issue_type,
          normalized.date || null,
          normalized.status,
          normalized.source,
          normalized.source_url,
          normalized.confidence,
          JSON.stringify(normalized.event_value),
          normalized.announcement || normalized.company_name,
          normalized.shares,
          normalized.issue_size
        ]
      );

      inserted++;
    } catch (err) {
      console.error("DB Insert Error:", err.message);
    }
  }

  return {
    success: true,
    scraped: events.length,
    inserted
  };
}

module.exports = { syncAllEvents } ; 
