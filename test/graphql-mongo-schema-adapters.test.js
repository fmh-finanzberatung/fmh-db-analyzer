const tape = require('tape');
const knexFile = require('../knexfile.js');
const knex = require('knex')(knexFile);
const log = require('mk-log');

const DbSchemaAdapters = require('../lib/db/mysql/mysql-schema-adapters.js');
const DbSchemaReader = require('../lib/db/mysql/mysql-schema-reader.js');
const GraphqlTypeBuilder = require('../lib/db/graphql-type-builder.js');
const { graphql } = require('graphql');

async function main() {
  await tape(async (t) => {
    try {
      //t.plan(1);
      const metaSchemas = await DbSchemaReader(knex);
      const journal = DbSchemaAdapters(metaSchemas);
      const graphqlTypeBuilder = GraphqlTypeBuilder(journal);

      graphqlTypeBuilder.tap
        .into('typeDef')
        .with('Person', (_SchemaDef, _node) => {});

      graphqlTypeBuilder.run();

      const graphqlSchema = graphqlTypeBuilder.schema;

      //log.info('schema', graphqlSchema);

      let res = await graphql(
        graphqlSchema,
        `
          query {
            car(make: "Not a Tesla") {
              id
            }
          }
        `
      );

      log.info('res', res);

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
