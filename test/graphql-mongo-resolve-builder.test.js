const tape = require('tape');
const log = require('mk-log');
const MongoSchemaAdapters = require('../lib/db/mongo/mongo-schema-adapters.js');
const MongoSchemaReader = require('../lib/db/mongo/mongo-schema-reader.js');
const GraphqlMongoResolveBuilder = require('../lib/resolvers/graphql-mongo-resolve-builder.js');
const Database = require('../lib/db/mongo/database');
const mongoFile = require('../mongofile.js');

async function main() {
  await tape('simple type', async (t) => {
    try {
      const db = await Database(mongoFile);
      const metaSchemas = await MongoSchemaReader(db);
      //log.info('metaSchemas', metaSchemas); 
      const journal = MongoSchemaAdapters(metaSchemas);
      //log.info('journal', journal); 
      const resolveBuilder = await GraphqlMongoResolveBuilder(db);



    } catch (err) {
      log.error(err);
    } finally {
      t.end();
      process.exit(0);
    }
  });
}

main();
