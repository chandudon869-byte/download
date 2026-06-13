const { detectIPO } = require("./ipoDetector");
const { extractCompany } = require("../utils/textCleaner");

function parseAnnouncement(item) {
  const text = item.announcementDetail;

  const { isIPO, confidence } = detectIPO(text);

  return {
    date: item.actionDate,
    company: extractCompany(text),
    type: isIPO ? "IPO" : "OTHER",
    confidence,
    raw: text
  };
}

module.exports = { parseAnnouncement };