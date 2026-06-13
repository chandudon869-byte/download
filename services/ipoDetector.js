function detectIPO(text = "") {
  const t = text.toLowerCase();

  let score = 0;

  if (t.includes("ipo")) score += 0.6;
  if (t.includes("initial public offering")) score += 0.6;
  if (t.includes("public issue")) score += 0.5;
  if (t.includes("sebon")) score += 0.2;
  if (t.includes("issuing") && t.includes("unit")) score += 0.3;

  if (t.includes("going to float")) score += 0.3;
  if (t.includes("issue shares")) score += 0.25;
  if (t.includes("offering")) score += 0.2;

  if (t.includes("right share")) score -= 0.4;
  if (t.includes("bonus")) score -= 0.5;
  if (t.includes("agm")) score -= 0.2;
  if (t.includes("book closure")) score -= 0.2;

  return {
    isIPO: score >= 0.6,
    confidence: Math.min(1, Math.max(0, score))
  };
}

module.exports = { detectIPO };