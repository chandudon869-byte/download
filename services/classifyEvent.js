const { classifyEvent } = require("../utils/classifyEvent");

function normalizeEvent(raw) {
  const text = raw.raw_text || raw.company_name || "";

  return {
    company_name: extractCompany(text),
    symbol: extractSymbol(text),
    event_type: classifyEvent(text),   // 👈 IMPORTANT HERE
    shares: extractShares(text),
    issue_size: extractIssueSize(text),
    open_date: null,
    close_date: null,
    status: "Upcoming",
    source: raw.source,
    source_url: raw.source_url
  };
}

// dummy placeholders if you don’t have them yet
function extractCompany(text) {
  return text.split(" ")[0]; // replace later with proper parser
}

function extractSymbol(text) {
  return "UNKNOWN";
}

function extractShares(text) {
  const match = text.match(/([\d,]+)\s*units/i);
  return match ? match[1] : "0";
}

function extractIssueSize(text) {
  return "0";
}

module.exports = { normalizeEvent };