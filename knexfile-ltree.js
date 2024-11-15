// knexfile.js
// must be in root of project
import log from 'mk-log';
import EnvVars from 'mk-env-vars';
const envVars = EnvVars({ custom: 'FMH', app: 'LTREE', deploy: 'TEST' });

const host = envVars('DBHOST');
const user = envVars('DBUSER');
const password = envVars('DBPASSWORD');
const database = envVars('DBNAME');

log.info('host', host);
log.info('user', user);
log.info('password', password);
log.info('database', database);

export default {
  client: 'mysql2',
  connection: {
    host,
    user,
    password,
    database, //envVars('GTB_MYSQLDATABASE'), //mk_db_analyzer_test',
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
