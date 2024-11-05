import path from 'path';
import log from 'mk-log';
import Knex from 'knex';
const knexConfig = await import(path.resolve('knexfile.js'));

const {
  client,
  connection: { host, database, password, user, charset },
} = knexConfig.default;

/*
const client = knexConfig.client;
const host = knexConfig.connection.host;
const database = knexConfig.connection.database;
const password = knexConfig.connection.password;
const user = knexConfig.connection.user;
const charset = knexConfig.connection.charset;
*/

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
    log.info(`dropping database ${database}`);

    let dropScript = `DROP DATABASE ${database}`;

    log.info('dropScript', dropScript);

    await knex.raw(dropScript);

    await knex.destroy();

    //const knexReloaded = require('knex')(knexConfig);
    //await knexReloaded.destroy();
  } catch (err) {
    log.error(err);
  }
}

main();
