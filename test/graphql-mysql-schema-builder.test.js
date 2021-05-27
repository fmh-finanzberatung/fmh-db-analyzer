const tape = require('tape');
const knexfile = require('../knexfile.js');
const log = require('mk-log');
const GraphQL = require('graphql');
const MysqlSchemaAdapters = require('../lib/db/mysql/mysql-schema-adapters.js');
const MysqlModelBuilder = require('../lib/db/mysql/mysql-model-builder.js');
const MysqlSchemaReader = require('../lib/db/mysql/mysql-schema-reader.js');
const Database = require('../lib/db/mysql/database');
//const DbIndexReader = require('../lib/db-index-reader.js');
const GraphqlSchemaBuilder = require('../lib/graphql-mysql-schema-builder.js');
// const destroyAll = require('../test/mysql/utils/destroy-all.js');

async function main() {
  await tape(async (t) => {
    try {
      const mysqlDatabase = Database(knexfile);
      const mysqlMetaSchemas = await MysqlSchemaReader(mysqlDatabase.knex);
      const journal = MysqlSchemaAdapters(mysqlMetaSchemas);
      const builder = MysqlModelBuilder(journal, mysqlDatabase.Bookshelf);
      //await prepareDatabase(builder);

      await builder.run();

      //log.info('journal', journal);

      const graphqlSchemaBuilder = await GraphqlSchemaBuilder(knexfile);
      graphqlSchemaBuilder.run();
      const schema = graphqlSchemaBuilder.schema;
      const resolvers = graphqlSchemaBuilder.resolvers;

      const result = await GraphQL.graphql(
        schema,
        `
          query {
            jobs(title: "Exterior") {
              docs {
                title
              }
            }
          }
        `,
        resolvers
      );

      log.info('result', result);

      t.end();
    } catch (err) {
      log.error(err);
    } finally {
      process.exit(0);
    }
  });
}

main();
