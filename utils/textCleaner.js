function extractCompany(text = "") {
  return text
    .split(" has ")[0]
    .split(" have ")[0]
    .split(" is ")[0]
    .split(" going to ")[0]
    .trim();
}

module.exports = { extractCompany };