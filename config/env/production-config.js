const {merge} = require('webpack-merge');
const baseConfig = require('./base-config.js');

const EnvVars = require('mk-env-vars');

const envVars = EnvVars({ app: 'DB_ANALYZER', deploy: 'PRODUCTION' });

module.exports = merge(baseConfig, {
  hashSalt: envVars('HASH_SALT'),
  transportOptions: {
    //service: 'deltapeak',
    host: envVars('MAILHOST'),
    //ignoreTLS: true, 
    auth: {
      user: envVars('MAILUSER'),
      pass: envVars('MAILPW')
    }
  }
});
