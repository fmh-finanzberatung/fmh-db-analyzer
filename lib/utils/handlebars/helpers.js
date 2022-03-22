const env = process.env.NODE_ENV || 'development';
const config = require(`../../../config/env/${env}-config.js`);

module.exports = {
  simpleHelper(data, options) {
    return options.fn(this);
  },
  confirmaHost() {
    return config.apiHost;
  },
  json(obj) {
    return JSON.stringify(obj);
  }
};


