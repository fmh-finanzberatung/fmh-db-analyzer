const EnvVars = require('mk-env-vars');
const envVars = EnvVars({ deploy: 'TEST' });

const host = envVars('GTB_MONGOHOST');
const dbName = envVars('GTB_MONGODATABASE');

module.exports = {
  host,
  dbName,
};
