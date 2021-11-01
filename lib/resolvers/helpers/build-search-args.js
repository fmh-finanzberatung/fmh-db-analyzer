const JsDataType = require('../../../lib/utils/js-data-type.js');
const log = require('mk-log');

module.exports = function buildSearchArgs(
  args,
  sanitizeStringQuery,
  { txt, num, bool } = { txt() {}, num() {}, bool() {} }
) {
  if (!args.search) return false;
  const result = [];
  for (let key in args.search) {
    const val = args.search[key];

    log.info('val', val);

    const searchDataType = JsDataType(val);
    if (searchDataType.isString()) {
      const sanitizedVal = sanitizeStringQuery(val);
      //whereItem = [`${key} LIKE ?`, [sanitizedVal]];
      txt({ key, val: sanitizedVal });
      result.push({ txt, num });
    } else if (searchDataType.isBoolean()) {
      bool({ key, val });
      //whereItem = [`${key} = ?`, [val]];
      result.push({ txt, num });
    } else if (searchDataType.isInteger()) {
      num({ key, val });
      //whereItem = [`${key} = ?`, [val]];
      result.push({ txt, num });
    }
  }
  return result;
};
