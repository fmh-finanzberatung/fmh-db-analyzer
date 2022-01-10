const tape = require('tape');
const knexFile = require('../../knexfile.js');
const knex = require('knex')(knexFile);
const log = require('mk-log');
const MysqlSchemaReader = require('../../lib/db/mysql/mysql-schema-reader');

async function main() {
  await tape(async (t) => {
    try {
      const metaSchemas = await MysqlSchemaReader(knex);
      log.info('metaSchemas', metaSchemas);
      t.true(metaSchemas.length > 0);
    } catch (err) {
      log.error(err);
    } finally {
      t.end();
      process.exit(0);
    }
  });
}

main();
