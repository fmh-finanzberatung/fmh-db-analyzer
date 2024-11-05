import path from 'path';
import log from 'mk-log';
import Knex from 'knex';
const knexConfig = await import(path.resolve('knexfile.js'));

const {
  client,
  connection: { host, database, password, user, charset },
} = knexConfig.default;

const knex = Knex({
  client,
  connection: {
    user,
    password,
    charset,
    host,
  },
});

async function main() {
  try {

    log.info(`creating database ${database}`);

    let createScript = `CREATE DATABASE ${database} CHARACTER SET ${charset} COLLATE utf8_unicode_ci;`;

    log.info('createScript', createScript);

    await knex.raw(createScript);

    let grantScript = `GRANT ALL ON ${database}.* to '${user}'@'${host}' IDENTIFIED BY '${password}';`;

    log.info('grantScript', createScript);
    await knex.raw(grantScript);

    knex.destroy();

  } catch (err) {
    log.error(err);
  }
}

main();
