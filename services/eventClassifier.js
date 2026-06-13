function classifyEvent(text = "") {
  const t = text.toLowerCase();

  let type = "UNKNOWN";
  let value = null;
  let confidence = 0;

  // IPO
  if (
    t.includes("ipo") ||
    t.includes("initial public offering") ||
    t.includes("public issuance of securities") ||
    (t.includes("book-building") && t.includes("ordinary shares"))
  ) {
    type = "IPO";
    confidence = 0.95;

    const units = text.match(/[\d,]+(?:\.\d+)?\s*units?/i);
    value = {
      units: units ? units[0] : null
    };
  }

  // BONUS
  if (t.includes("bonus")) {
    type = "BONUS";
    confidence = 0.9;

    const match = t.match(/(\d+(\.\d+)?)\s*%/);
    if (match) value = match[0];
  }

  // DIVIDEND
  if (t.includes("dividend")) {
    type = "DIVIDEND";
    confidence = 0.9;

    const match = t.match(/(\d+(\.\d+)?)\s*%/);
    if (match) value = match[0];
  }

  // RIGHT SHARE
  if (t.includes("right") || t.includes("rights issue")) {
    type = "RIGHT_SHARE";
    confidence = 0.9;

    const ratio = t.match(/\d+(\.\d+)?\s*:\s*\d+(\.\d+)?/);
    const price = t.match(/rs\.?\s*\d+(\.\d+)?/i);

    value = {
      ratio: ratio ? ratio[0] : null,
      price: price ? price[0] : null
    };
  }

  // AGM
  if (
    t.includes("agm") ||
    t.includes("annual general meeting") ||
    t.includes("book closure")
  ) {
    type = "AGM";
    confidence = 0.85;
    value = null;
  }

  return { type, value, confidence };
}

module.exports = { classifyEvent };
