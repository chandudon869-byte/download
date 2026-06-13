function validateIPO(ipo) {
  return (
    ipo.company_name &&
    ipo.symbol &&
    ipo.status
  );
}

module.exports = { validateIPO };