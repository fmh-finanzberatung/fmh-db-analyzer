const ELLIPSIS = '…';
const OVERFLOW_TYPE_RIGHT = false;
const OVERFLOW_TYPE_LEFT = true;

const log = require('mk-log');
module.exports = {
  ensureTruncate(text, newOptions = {}) {
    const options = Object.assign(
      {
        maxWidth: 10,
        ellipsis: ELLIPSIS,
        overflowType: OVERFLOW_TYPE_LEFT 
      },
      newOptions
    );
    if (!text || options.maxWidth === 0) {
      return '';
    }
    if (text.length <= options.maxWidth) {
      return text;
    }

    if (options.overflowType === OVERFLOW_TYPE_RIGHT) {
      const subString = text.substr(0, options.maxWidth - ELLIPSIS.length); 
      return subString + ELLIPSIS;
    }

    // ELLIPSIS_POS_TYPE_LEFT 
    const offset = text.length - options.maxWidth;
    const subString = text.substr(offset, options.maxWidth); 

    const result = ELLIPSIS + subString;
    return result;
  },
  Const: {
    ELLIPSIS,
    OVERFLOW_TYPE_LEFT,
    OVERFLOW_TYPE_RIGHT,
  }
};
