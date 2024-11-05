import tape from 'tape';
import knexfile from '../../knexfile.js';
import Knex from 'knex';
import log from 'mk-log';
import MysqlSchemaReader from '../../lib/db/mysql/mysql-schema-reader.js';

log.info('knexfile', knexfile);

const knex = Knex(knexfile);

async function main() {
  tape(async (t) => {
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
