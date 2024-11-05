// knexfile.js
// must be in root of project
import EnvVars from 'mk-env-vars';
const envVars = EnvVars({ deploy: 'TEST' });

export default {
  client: 'mysql2',
  connection: {
    host: envVars('GTB_MYSQLHOST'),
    user: envVars('GTB_MYSQLDBUSER'),
    password: envVars('GTB_MYSQLPASSWORD'),
    database: 'mk_db_analyzer_test',
    charset: 'utf8',
    //preciseTimestamps: true,
  },
  debug: false,
  pool: {
    min: 0,
    max: 30,
  },
  migrations: {
    directory: './test/mysql/migrations',
    tableName: 'knex_migrations',
  },
};
