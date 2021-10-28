module.exports = function sanitizeStringQuery(s) {
  if (!s) return '';
  return s.replace(/^\*/, '%').replace(/\*$/, '%');
};
