const env = process.env.NODE_ENV || 'development';
const config = await import(`../../../config/env/${env}-config.js`);

export default {
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


