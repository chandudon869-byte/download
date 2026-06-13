const crypto = require("crypto");

function makeHash(text) {
  return crypto.createHash("md5").update(text).digest("hex");
}

module.exports = { makeHash };