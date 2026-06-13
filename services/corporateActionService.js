const pool = require("../db/pool");
const { syncAllEvents } = require("./syncService");

const DEFAULT_SYNC_DAYS = 365;

function getFromDate(daysBack = DEFAULT_SYNC_DAYS) {
  const from = new Date();
  from.setDate(from.getDate() - daysBack);
  return from;
}

async function queryCorporateActions(types) {
  const upperTypes = types.map((type) => type.toUpperCase());

  let result = await pool.query(
    `
    SELECT *
    FROM stock_events
    WHERE UPPER(type) = ANY($1::text[])
    ORDER BY date DESC NULLS LAST, updated_at DESC
    `,
    [upperTypes]
  );

  if (result.rows.length > 0) {
    return result.rows;
  }

  result = await pool.query(
    `
    SELECT *
    FROM upcoming_ipos
    WHERE UPPER(issue_type) = ANY($1::text[])
    ORDER BY updated_at DESC NULLS LAST, id DESC
    `,
    [upperTypes]
  );

  return result.rows;
}

async function getCorporateActionRows(types, options = {}) {
  let rows = await queryCorporateActions(types);

  if (rows.length === 0 && options.syncWhenEmpty !== false) {
    await syncAllEvents(getFromDate(options.daysBack), new Date());
    rows = await queryCorporateActions(types);
  }

  return rows;
}

module.exports = {
  getCorporateActionRows,
};
