import {merge} from 'webpack-merge';
import baseConfig from './base-config.js';

import EnvVars from 'mk-env-vars';

const envVars = EnvVars({ app: 'DB_ANALYZER', deploy: 'DEVELOPMENT' });

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
