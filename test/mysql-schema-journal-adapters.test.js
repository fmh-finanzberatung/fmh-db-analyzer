const tape = require('tape');
const knexfile = require('../knexfile.js');
const Database = require('../lib/db/mysql/database.js');
const log = require('mk-log');
const MysqlSchemaJournalAdapters = require('../lib/db/mysql/mysql-schema-journal-adapters.js');
const MysqlSchemaReader = require('../lib/db/mysql/mysql-schema-reader.js');

async function main() {
  await tape(async (t) => {
    try {
      const database = Database(knexfile);
      const metaSchemas = await MysqlSchemaReader(database.knex);

      const journal = MysqlSchemaJournalAdapters(metaSchemas);
      log.info('journal', journal);
    } catch (err) {
      log.error(err);
    } finally {
      t.end();
      process.exit(0);
    }
  });
}

main();
