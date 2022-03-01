const log = require('mk-log');
const crypto = require('crypto');

function hashKey(s) {
  if (!s) {
    throw new Error('A string must be provided!');
  }
  return {
    create(salt) {
      if (!salt) {
        throw new Error('Hash salt must be provided!');
      }
      const md5 = crypto.createHash('md5');
      const result = md5.update(s + salt).digest('hex');
      return result;
    },
  };
}

module.exports = hashKey;
