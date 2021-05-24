const pluralize = require('pluralize');
module.exports = function graphNodeName(tableName) {
  return pluralize.singular(tableName);
};
