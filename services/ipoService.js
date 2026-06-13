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
 * MAIN SYNC FUNCTION
 */
async function syncIPOs() {
  try {
    const events = await scrapeStockEvents("6/1/2026", "6/30/2026");

    let inserted = 0;

    for (const event of events) {
      const normalized = normalizeEvent(event);
      if (!normalized) continue;

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

        console.log("Inserted IPO:", normalized.company_name);
        inserted++;
      } catch (err) {
        console.error("DB Insert Error:", err.message);
      }
    }

    return inserted;
  } catch (err) {
    console.error("Sync Error:", err.message);
    return 0;
  }
}

module.exports = {
  syncIPOs,
};
