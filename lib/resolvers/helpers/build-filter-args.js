const JsDataType = require('../../../lib/utils/js-data-type.js');
const log = require('mk-log');

function loop(inputFilterArgs, sanitizeStringQuery, { txt, num, bool }) {
  const result = [];
  for (let key in inputFilterArgs) {
    const val = inputFilterArgs[key];

    log.info('val ********************** ', val);

    const searchDataType = JsDataType(val);
    if (searchDataType.isString()) {
      const sanitizedVal = sanitizeStringQuery(val);
      txt({ key, val: sanitizedVal });
      result.push({ txt, num });
    } else if (searchDataType.isBoolean()) {
      bool({ key, val });
      result.push({ txt, num });
    } else if (searchDataType.isInteger()) {
      num({ key, val });
      result.push({ txt, num });
    }
  }
  return result;
}

module.exports = function buildFilterArgs(args, sanitizeStringQuery) {
  return {
    search({ txt, num, bool } = { txt() {}, num() {}, bool() {} }) {
      if (!args.search) return false;
      return loop(args.search, sanitizeStringQuery, { txt, num, bool });
    },
    exclude({ txt, num, bool } = { txt() {}, num() {}, bool() {} }) {
      if (!args.exclude) return false;
      return loop(args.exclude, sanitizeStringQuery, { txt, num, bool });
    },
  };
};
