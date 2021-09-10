const tape = require('tape');
const mongoFile = require('../mongofile.js');
const Database = require('../lib/db/mongo/database.js');
const log = require('mk-log');
const GraphqlMongoResolveBuilder = require('../lib/resolvers/graphql-mongo-resolve-builder.js');
const GraphqlTypeBuilder = require('../lib/graphql-type-builder.js');

const MongoSchemaJournalAdapters = require('../lib/db/mongo/mongo-schema-journal-adapters.js');
const MongoSchemaReader = require('../lib/db/mongo/mongo-schema-reader.js');
const GraphqlSchemaBuilder = require('../lib/graphql-schema-builder.js');
const { graphql } = require('graphql');

async function main() {
  await tape(async (t) => {
    try {
      const db = await Database(mongoFile);
      const resolveBuilder = await GraphqlMongoResolveBuilder(db);
      const metaSchemas = await MongoSchemaReader(db);
      const journal = MongoSchemaJournalAdapters(metaSchemas);
      //log.info('journal', journal);

      journal.forEach((node) => {
        log.debug(JSON.stringify(node, null, 2));
        //log.info('node.domesticAttributes()', node.domesticAttributes());
      });

      journal.forEach((node) => {
        log.debug(node);
        //log.info('node.edges() *************** ', node.edges());
        log.info('node.edges() *************** ', node.edges());
      });

      const schemaBuilder = await GraphqlSchemaBuilder({
        resolveBuilder,
        journal,
      });
      schemaBuilder.run();
      //const graphqlTypeBuilder = GraphqlTypeBuilder(journal);

      //const graphqlSchema = schemaBuilder.schema;

      //log.warn('This test needs an implementation');

      //let res
      /*
      await graphql(
        graphqlSchema,
        `
          query {
            car(make: "Not a Tesla") {
              id
            }
          }
        `
      );
      */
      //log.info('res', res);

      log.info('after run');
    } catch (err) {
      log.error(err);
    } finally {
      t.end();
      process.exit(0);
    }
  });
}

main();
