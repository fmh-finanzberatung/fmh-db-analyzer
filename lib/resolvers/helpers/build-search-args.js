const JsDataType = require('../../../lib/utils/js-data-type.js');

module.exports = function buildSearchArgs(args, sanitizeStringQuery, fn) {
  if (!args.search) return false;
  const result = [];
  for (let key in args.search) {
    const val = args.search[key];
    let whereItem = null;
    const searchDataType = JsDataType(val);
    if (searchDataType.isString()) {
      const sanitizedVal = sanitizeStringQuery(val);
      //whereItem = [`${key} LIKE ?`, [sanitizedVal]];
      whereItem = { key, val: sanitizedVal };
    } else if (searchDataType.isInteger()) {
      whereItem = { key, val };
      //whereItem = [`${key} = ?`, [val]];
    }
    if (whereItem) {
      fn({ key, val });
      result.push({ key, val });
    }
  }
  return result;
};
