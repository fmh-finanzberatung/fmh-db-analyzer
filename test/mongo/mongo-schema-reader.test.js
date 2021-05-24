const tape = require('tape');
const mongoFile = require('../../mongofile.js');
const Database = require('../../lib/db/mongo/database.js');
const log = require('mk-log');
const MongoSchemaReader = require('../../lib/db/mongo/mongo-schema-reader');

async function main() {
  tape(async (t) => {
    try {
      const client = await Database(mongoFile);
      const db = client.db(mongoFile.dbName);
      const result = await MongoSchemaReader(db);

      log.info('result', JSON.stringify(result, null, 4));

      //t.true(collections.length > 0);
      t.true(result.length === 3);
    } catch (err) {
      log.error(err);
    } finally {
      t.end();
    }
  });
}

main();
