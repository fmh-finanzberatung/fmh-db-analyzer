const path = require('path');
const knexConfig = require(path.resolve('knexfile.js'));
const log = require('mk-log');

const client = knexConfig.client;
const host = knexConfig.connection.host;
const database = knexConfig.connection.database;
const password = knexConfig.connection.password;
const user = knexConfig.connection.user;
const charset = knexConfig.connection.charset;

async function main() {
  try {
    const knex = await require('knex')({
      client,
      connection: {
        user,
        password,
        charset,
        host,
      },
    });

    log.info(`dropping database ${database}`);

    let dropScript = `DROP DATABASE ${database}`;

    log.info('dropScript', dropScript);

    await knex.raw(dropScript);

    await knex.destroy();

    const knexReloaded = require('knex')(knexConfig);
    await knexReloaded.destroy();
  } catch (err) {
    log.error(err);
  }
}

main();
