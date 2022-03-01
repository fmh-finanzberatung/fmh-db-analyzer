const log = require('mk-log');

module.exports = function MockupPlugin(options = { name: 'config' }) {
  return function ({ txt, query = () => {} }) {
    log.info('MockupPlugin', txt);
    query(txt);
  };
};
