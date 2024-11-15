import {merge} from 'webpack-merge';
import baseConfig from './base-config.js';
import log from 'mk-log';
import EnvVars from 'mk-env-vars';

const envVars = EnvVars({ app: 'DB_ANALYZER', deploy: 'DEVELOPMENT' });

const hashSalt = envVars('HASH_SALT');

log.info('hashSalt', hashSalt);

export default merge(baseConfig, {
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
