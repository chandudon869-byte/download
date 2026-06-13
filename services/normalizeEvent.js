const { classifyEvent } = require("./eventClassifier");

const SYMBOL_BY_COMPANY = {
  "appolo hydropower limited": "APHL",
  "bhujung hydropower limited": "BJHL",
  "ridge line energy limited": "RLEL",
  "snow rivers limited": "SNOW",
  "sopan pharmaceuticals limited": "SOPL",
  "suryakunda hydro electric limited": "SKHEL"
};

const INVALID_SYMBOLS = new Set([
  "AGM",
  "FPO",
  "IPO",
  "LOCALS",
  "PUBLIC",
  "QII",
  "SGM",
  "SHARE",
  "SHARES"
]);

function normalizeEvent(raw = {}) {
  const rawText = getRawText(raw);
  if (!rawText || rawText.length < 10) return null;

  const { type, confidence, value } = classifyEvent(rawText);
  const issueType = normalizeIssueType(type);
  if (!issueType || confidence < 0.3) return null;

  const companyName = extractCompanyName(rawText);
  if (!companyName) return null;

  const shares = extractShares(rawText);
  const symbol = extractSymbol(rawText, companyName);
  const status = determineStatus(rawText);
  const manualReviewReasons = getManualReviewReasons({
    companyName,
    symbol,
    shares,
    rawText,
    type: issueType
  });

  // Extract percentage for Dividend/Bonus
  const percentage = extractPercentage(rawText);
  
  // Extract ratio for RightShare
  const ratio = extractRatio(rawText);

  return {
    company_name: companyName,
    symbol,
    shares,
    issue_size: shares || (issueType === "DIVIDEND" || issueType === "BONUS" ? percentage : 0),
    issue_type: issueType,
    status,
    source: raw.source || "merolagani",
    source_url: raw.source_url || raw.sourceUrl || "https://merolagani.com",
    date: extractEventDate(raw),
    announcement: rawText,
    event_value: {
      units: shares || null,
      percentage: percentage || null,
      ratio: ratio || null,
      manual_review: manualReviewReasons.length > 0,
      manual_review_reasons: manualReviewReasons
    },
    confidence: calculateConfidence({
      baseConfidence: confidence,
      companyName,
      symbol,
      shares,
      manualReviewReasons
    })
  };
}

function normalizeIssueType(type = "") {
  const upper = String(type).toUpperCase();

  if (upper === "IPO") return "IPO";
  if (upper === "BONUS") return "BONUS";
  if (upper === "DIVIDEND") return "DIVIDEND";
  if (upper === "RIGHT_SHARE") return "RIGHT_SHARE";
  if (upper === "AGM") return "AGM";

  return null;
}

function extractEventDate(raw = {}) {
  const candidate =
    raw.date ||
    raw.actionDate ||
    raw.announcementDate ||
    raw.open_date ||
    raw.openDate ||
    null;

  if (!candidate) return null;

  const parsed = new Date(candidate);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return candidate;
}

function getRawText(raw) {
  return String(
    raw.announcementDetail ||
    raw.announcement ||
    raw.raw_text ||
    raw.rawText ||
    raw.company_name ||
    ""
  )
    .replace(/\n|\r/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractCompanyName(text = "") {
  const cleaned = text
    .replace(/^Listing of\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

  const afterDash = cleaned.match(/\s-\s(.+?)(?:\s+\([A-Z]{2,10}\))?$/);
  if (afterDash && looksLikeCompany(afterDash[1])) {
    return cleanCompanyName(afterDash[1]);
  }

  const afterBookClosure = cleaned.match(
    /\bbook\s+closure\s+(?:of|for)\s+(.+?\b(?:Limited|Ltd\.?|Bank|Hydropower|Hydro|Energy|Company|Finance|Insurance|Hospital|College|Pharmaceuticals|Industries)\b)/i
  );
  if (afterBookClosure && looksLikeCompany(afterBookClosure[1])) {
    return cleanCompanyName(afterBookClosure[1]);
  }

  const beforeAction = cleaned.match(
    /^(.+?)\s+(?:has\s+(?:extended|published|notified|issued|distributed|opened|closed|allotted|listed|made)|is\s+going\s+to|opened|closed|will\s+(?:open|close|issue)|published|notified|issued)\b/i
  );
  if (beforeAction && looksLikeCompany(beforeAction[1])) {
    return cleanCompanyName(beforeAction[1]);
  }

  const companyPrefix = cleaned.match(
    /^(.+?\b(?:Limited|Ltd\.?|Bank|Hydropower|Hydro|Energy|Company|Finance|Insurance|Hospital|College|Pharmaceuticals|Industries)\b)/i
  );
  if (companyPrefix) {
    return cleanCompanyName(companyPrefix[1]);
  }

  return null;
}

function cleanCompanyName(name = "") {
  return name
    .replace(/\s+\([A-Z]{2,10}\)\s*$/i, "")
    .replace(/\s+\b(?:has\s+(?:extended|published|notified|issued|distributed|opened|closed|allotted|listed|made)|is\s+going\s+to|opened|closed|published|notified|issued)\b.*$/i, "")
    .replace(/[.,;:\-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeCompany(value = "") {
  return /\b(Limited|Ltd\.?|Bank|Hydropower|Hydro|Energy|Company|Finance|Insurance|Hospital|College|Pharmaceuticals|Industries)\b/i.test(value);
}

function extractSymbol(text = "", companyName = "") {
  const symbols = [...text.matchAll(/\(([A-Z]{2,12})\)/gi)]
    .map((match) => match[1].toUpperCase())
    .filter((symbol) => !INVALID_SYMBOLS.has(symbol));

  if (symbols.length) return symbols[symbols.length - 1];

  return SYMBOL_BY_COMPANY[companyName.toLowerCase()] || "UNKNOWN";
}

function extractShares(text = "") {
  const match = text.match(/([\d,]+(?:\.\d+)?)\s*(?:units?|shares?)/i);
  if (!match) return 0;

  return Number(match[1].replace(/,/g, "").split(".")[0]) || 0;
}

// Extract percentage for Dividend/Bonus
function extractPercentage(text = "") {
  const match = text.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!match) return null;
  return match[1];
}

// Extract ratio for RightShare (e.g., 1:5)
function extractRatio(text = "") {
  const match = text.match(/(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;
  return `${match[1]}:${match[2]}`;
}

function determineStatus(text = "") {
  const t = text.toLowerCase();

  if (/\b(listed|listing|has been listed)\b/.test(t)) {
    return "LISTED";
  }

  if (/\b(allotted|distributed|closed|closing)\b/.test(t) || /\bclose(?:s|d)?\b/.test(t)) {
    return "CLOSED";
  }

  if (/\b(opened|opening|started|extended)\b/.test(t) || /\bopen(?:s)?\b/.test(t)) {
    return "OPEN";
  }

  if (/\b(is going to|will|upcoming|starting from|issue|issuing)\b/.test(t)) {
    return "UPCOMING";
  }

  return "UPCOMING";
}

function getManualReviewReasons({ companyName, symbol, shares, rawText, type }) {
  const reasons = [];

  if (!companyName || !looksLikeCompany(companyName)) {
    reasons.push("company_name_partial");
  }

  if (symbol === "UNKNOWN") {
    reasons.push("symbol_missing");
  }

  // For Dividend/Bonus, percentage is more important than shares
  const percentage = extractPercentage(rawText);
  if (["DIVIDEND", "BONUS"].includes(type) && !percentage) {
    reasons.push("percentage_missing");
  }

  if (!shares && !["DIVIDEND", "BONUS", "AGM"].includes(type)) {
    reasons.push("units_missing");
  }

  if (/\bhas\s+(extended|published|notified|issued)\b/i.test(companyName)) {
    reasons.push("company_name_has_announcement_suffix");
  }

  return reasons;
}

function calculateConfidence({ baseConfidence, companyName, symbol, shares, manualReviewReasons }) {
  if (manualReviewReasons.includes("company_name_partial")) return 0.2;
  if (manualReviewReasons.includes("company_name_has_announcement_suffix")) return 0.2;
  if (!shares && symbol === "UNKNOWN") return 0.2;
  if (!shares) return 0.5;
  if (symbol === "UNKNOWN") return 0.8;
  if (companyName && symbol !== "UNKNOWN" && shares) return 1;

  return Math.min(baseConfidence || 0.95, 0.95);
}

module.exports = {
  normalizeEvent,
  extractCompanyName,
  extractShares,
  extractSymbol,
  determineStatus
};
