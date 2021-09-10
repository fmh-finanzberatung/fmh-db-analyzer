module.exports = function isDateTimeRange(rangeObj) {
  if (!rangeObj) return false;
  const res =
    (rangeObj.startVal && rangeObj.startVal.year) ||
    (rangeObj.endVal && rangeObj.endVal.year);
  return res;
};
