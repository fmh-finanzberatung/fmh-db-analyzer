module.exports = function ensureTwoDigits(num) {
  return new Number(num).toLocaleString('de', { minimumIntegerDigits: 2 });
};
