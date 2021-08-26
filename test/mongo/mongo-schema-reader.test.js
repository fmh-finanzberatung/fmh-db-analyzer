const tape = require('tape');
const mongoFile = require('../../mongofile.js');
const Database = require('../../lib/db/mongo/database.js');
const log = require('mk-log');
const MongoSchemaReader = require('../../lib/db/mongo/mongo-schema-reader');

async function main() {
  tape(async (t) => {
    try {
      const db = await Database(mongoFile);
      const result = await MongoSchemaReader(db);

      const flattenedResult = result.flat();
      log.info('result', JSON.stringify(flattenedResult, null, 4));

      //t.true(collections.length > 0);
      t.equals(3, flattenedResult.length, 'collection definitions');
    } catch (err) {
      log.error(err);
    } finally {
      t.end();
    }
  });
}

main();
