const tape = require('tape');
require('dotenv').config();
const log = require('mk-log');

//const GraphQL = require('graphql');
const GraphqlMysqlSchemaBuilder = require('../lib/graphql-mysql-schema-builder.js');

async function main() {
  await tape('mysql', async (mainTest) => {
    await mainTest.test(async (t) => {
      try {
        const schemaBuilder = await GraphqlMysqlSchemaBuilder();
        const schema = await schemaBuilder.run();
        await builder.run();

        const graphqlSchemaBuilder = await GraphqlSchemaBuilder({
          journal,
          resolveBuilder,
        });a
        await graphqlSchemaBuilder.run();
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
