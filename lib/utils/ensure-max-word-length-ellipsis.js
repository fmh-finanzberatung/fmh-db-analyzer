const ELLIPSIS = '…';
const log = require('mk-log');
module.exports = function ensureMaxWordLengthEllipsis(text, newOptions = {}) {
  const options = Object.assign(
    {
      maxWidth: 10,
      ellipsis: ELLIPSIS,
    },
    newOptions
  );
  if (!text || options.maxWidth === 0) {
    return '';
  }
  if (text.length <= options.maxWidth) {
    return text;
  }
  const result = text.substr(0, options.maxWidth - ELLIPSIS.length) + ELLIPSIS;
  return result;
};
