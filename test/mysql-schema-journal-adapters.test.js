const tape = require('tape');
const knexFile = require('../knexfile.js');
const knex = require('knex')(knexFile);
const log = require('mk-log');
const GraphqlMysqlResolveBuilder = require('../lib/resolvers/graphql-mysql-resolve-builder.js');
const MysqlSchemaAdapters = require('../lib/db/mysql/mysql-schema-journal-adapters.js');
const MysqlSchemaReader = require('../lib/db/mysql/mysql-schema-reader.js');
const GraphqlSchemaBuilder = require('../lib/graphql-schema-builder.js');
const { graphql } = require('graphql');

async function main() {
  await tape(async (t) => {
    try {
      const resolveBuilder = await GraphqlMysqlResolveBuilder(knexFile);
      const mysqlMetaSchemas = await MysqlSchemaReader(knex);
      const journal = MysqlSchemaAdapters(mysqlMetaSchemas);
      const schemaBuilder = await GraphqlSchemaBuilder({
        resolveBuilder,
        journal,
      });
      schemaBuilder.run();
      const graphqlSchema = schemaBuilder.schema;

      log.warn('This test needs an implementation');

      //t.plan(1);
      //const metaSchemas = await MysqlSchemaReader(knex);
      //const journal = MysqlSchemaAdapters(metaSchemas);
      //journal.forEach((node) => {
      //    const graphqlTypeBuilder = GraphqlTypeBuilder(node);

      //let res =
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
    } catch (err) {
      log.error(err);
    } finally {
      t.end();
      process.exit(0);
    }
  });
}

main();
