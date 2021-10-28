const tape = require('tape');
const knexFile = require('../knexfile.js');
const knex = require('knex')(knexFile);
const log = require('mk-log');
const GraphqlMysqlResolveBuilder = require('../lib/resolvers/graphql-mysql-resolve-builder.js');
const MysqlSchemaAdapters = require('../lib/db/mysql/mysql-schema-journal-adapters.js');
const MysqlSchemaReader = require('../lib/db/mysql/mysql-schema-reader.js');
const GraphqlSchemaBuilder = require('../lib/graphql-schema-builder.js');
const DbToGraphqlTypesMap = require('../lib/utils/db-to-graphql-types-map');
const typesMap = DbToGraphqlTypesMap('mysql');
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
        typesMap,
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
      const result = await graphql(
        graphqlSchema,
        `
          {
            jobs(pagination: { page: 1, pageSize: 3 }) {
              pagination {
                page
                pageSize
              }
              docs {
                id
                title
                persons(
                  order: { id: DESC }
                  pagination: { page: 1, pageSize: 2 }
                ) {
                  pagination {
                    page
                    pageSize
                    pages
                    total
                  }
                  docs {
                    id
                    given_name
                    family_name
                  }
                }
              }
            }
          }
        `,
        null,
        { text: 'I am context' }
      );
      //log.info('result', result);
      log.info('result', JSON.stringify(result, null, 2));
    } catch (err) {
      log.error(err);
    } finally {
      t.end();
      process.exit(0);
    }
  });
}

main();
