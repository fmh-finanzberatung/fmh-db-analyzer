const {merge} = require('webpack-merge');
const baseConfig = require('./base-config.js');

const EnvVars = require('mk-env-vars');

const envVars = EnvVars({ app: 'DB_ANALYZER', deploy: 'TEST' });

module.exports = merge(baseConfig, {
  hashSalt: envVars('HASH_SALT'),
  siteName: 'Test Site',
  registration: {
    url: 'http://localhost', 
    // from is defined in base-config.js
    replyTo: 'register@galt.de',
    user: {
      email: 'test@galt.de',
    }
  },
  login: {
    url: 'http://localhost/login',
  },
  transportOptions: {
    //service: 'deltapeak',
    host: envVars('MAILHOST'),
    //ignoreTLS: true, 
    auth: {
      user: envVars('MAILUSER'),
      pass: envVars('MAILPW')
    }
  },
  imapOptions: {
    //service: 'deltapeak',
    host: envVars('IMAPHOST'),
    secure: true, 
    //ignoreTLS: true, 
    auth: {
      user: envVars('IMAPUSER'),
      pass: envVars('IMAPPW')
    }
  }
});
