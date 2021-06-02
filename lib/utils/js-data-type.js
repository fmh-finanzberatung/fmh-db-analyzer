const log = require('mk-log');

module.exports = function JsDataType(val) {
  let dataType;
  const pub = {
    isString() {
      return dataType === 'string';
    },
    isArray() {
      return dataType === 'array';
    },
    isObject() {
      return dataType === 'object';
    },
    isInteger() {
      return dataType === 'integer';
    },
    isFloat() {
      log.info('dataType', dataType);
      log.info('dataType', dataType === 'float');
      return dataType === 'float';
    },
  };
  if (typeof val === 'string') {
    dataType = 'string';
    return pub;
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      dataType = 'integer';
      return pub;
    }
    dataType = 'float';
    return pub;
  }
  if (Array.isArray(val)) {
    dataType = 'array';
    return pub;
  }
  dataType = 'object';
  return pub;
};
