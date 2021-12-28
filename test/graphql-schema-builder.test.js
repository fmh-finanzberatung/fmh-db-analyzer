const tape = require('tape');
const knexfile = require('../knexfile.js');
const log = require('mk-log');
const GraphQL = require('graphql');
const MysqlSchemaReader = require('../lib/db/mysql/mysql-schema-reader.js');
const MysqlSchemaAdapters = require('../lib/db/mysql/mysql-schema-adapters.js');
const MysqlModelBuilder = require('../lib/db/mysql/mysql-model-builder.js');
const MysqlDatabase = require('../lib/db/mysql/database');
const GraphqlSchemaBuilder = require('../lib/graphql-schema-builder.js');
const GraphqlMysqlResolveBuilder = require('../lib/resolvers/graphql-mysql-resolve-builder.js');

const MongoSchemaAdapters = require('../lib/db/mongo/mongo-schema-adapters.js');
const MongoSchemaReader = require('../lib/db/mongo/mongo-schema-reader.js');
const GraphqlMongoResolveBuilder = require('../lib/resolvers/graphql-mongo-resolve-builder.js');
const MongoDatabase = require('../lib/db/mongo/database');
const mongoFile = require('../mongofile.js');

async function main() {
  await tape('mysql', async (mainTest) => {
    await mainTest.test(async (t) => {
      try {
        const resolveBuilder = await GraphqlMysqlResolveBuilder(knexfile);
        const mysqlDatabase = MysqlDatabase(knexfile);
        const mysqlMetaSchemas = await MysqlSchemaReader(mysqlDatabase.knex);
        const journal = MysqlSchemaAdapters(mysqlMetaSchemas);
        const builder = MysqlModelBuilder(journal, mysqlDatabase.Bookshelf);
        await builder.run();

        const graphqlSchemaBuilder = await GraphqlSchemaBuilder({
          journal,
          resolveBuilder,
        });
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

        log.debug('result', result);
      } catch (err) {
        log.error(err);
      } finally {
        t.end();
      }
    });
  });
  await tape('mongo', async (mainTest) => {
    await mainTest.test(async (t) => {
      try {
        //const db = await MongoDatabase(mongoFile);
        //const resolveBuilder = await GraphqlMongoResolveBuilder(db);
        //const metaSchemas = await MongoSchemaReader(db);
        //const journal = MongoSchemaAdapters(metaSchemas);
        //const graphqlTypeBuilder = GraphqlTypeBuilder(journal);

        //log.info('journal', journal);
        log.info('need to implement mongo test');

        /*
        const graphqlSchemaBuilder = await GraphqlSchemaBuilder({
          journal,
          resolveBuilder,
        });
        graphqlSchemaBuilder.run();
        const schema = graphqlSchemaBuilder.schema;
        log.info('schema', schema);
        */
        /* 
        const resolvers = graphqlSchemaBuilder.resolvers;


        const result = await GraphQL.graphql(
          schema,
          `query {
            jobs
          }`,
          resolvers
        );
        */
        //log.info('result', result);
      } catch (err) {
        log.error(err);
      } finally {
        t.end();
      }
    });
    //process.exit(2);
  });
}

main();
