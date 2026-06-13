function classifyEvent(text = "") {
  const lower = text.toLowerCase();

  if (lower.includes("ipo") || lower.includes("initial public offering")) {
    return "IPO";
  }

  if (lower.includes("bonus share") || lower.includes("bonus issue")) {
    return "BONUS";
  }

  if (lower.includes("dividend") || lower.includes("cash dividend")) {
    return "DIVIDEND";
  }

  if (lower.includes("right share") || lower.includes("rights issue")) {
    return "RIGHT_SHARE";
  }

  return "UNKNOWN";
}

module.exports = { classifyEvent };