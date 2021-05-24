const tape = require('tape');
const knexFile = require('../../knexfile.js');
const knex = require('knex')(knexFile);
const log = require('mk-log');
const MysqlSchemaReader = require('../../lib/db/mysql/mysql-schema-reader');

async function main() {
  tape(async (t) => {
    try {
      const metaSchemas = await MysqlSchemaReader(knex);
      t.true(metaSchemas.length > 0);
    } catch (err) {
      log.error(err);
    } finally {
      t.end();
    }
  });
}

main();
