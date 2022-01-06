const tape = require('tape');
const log = require('mk-log');
const GraphQL = require('graphql');
const GraphqlMysqlSchemaBuilder = require('../lib/graphql-mysql-schema-builder.js');

async function main() {
  await tape(async (t) => {
    try {
      const schemaBuilder = await GraphqlMysqlSchemaBuilder();
      const schema = await schemaBuilder.run();
      //log.info('schema', schema);
      const queryResult = await GraphQL.graphql(
        schema,
        `
        query {
          banks{
            docs {
              id
              name
              films {
                docs {
                  id
                } 
              }
            } 
          }
        }`,
        null,
        {}
      );
      log.info('queryResult', JSON.stringify(queryResult, null, 4));
      /*
      const queryResult = await GraphQL.graphql(
        schema,
        `
        query {
          hello
          person {
            id
          }
          personList {
            error {
              message
            } 
          }
          company {
            children {
              docs {
                id
              }
            }
            error {
              message
            } 
          }
        }
      `
      );
      log.info('queryResult', queryResult);
      t.ok(queryResult, 'queryResult is ok');
      const mutationResult = await GraphQL.graphql(
        schema,
        `
        mutation {
         createPersonList {
            id
            name
          }
        }
      `
      );
      t.ok(mutationResult, 'mutationResult is ok');
      */
    } catch (e) {
      t.fail(e);
    } finally {
      t.end();
    }
  });
}

main();
