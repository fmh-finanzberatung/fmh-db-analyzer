const tape = require('tape');
const log = require('mk-log');
const GraphQL = require('graphql');
const GraphqlMysqlSchemaBuilder = require('../lib/graphql-mysql-schema-builder.js');
const knexfile = require('../knexfile-test.js');
const Database = require('../lib/db/mysql/database.js');
const MysqlSchemaReader = require('../lib/db/mysql/mysql-schema-reader.js');
const MysqlSchemaJournalAdapters = require('../lib/db/mysql/mysql-schema-journal-adapters');

async function main() {
  await tape(async (test) => {
    try {
      const schemaBuilder = await GraphqlMysqlSchemaBuilder();
      const schema = await schemaBuilder.run();
      const database = await Database(knexfile);

      await test.test('create table', async (t) => {
        const mutationCreateResult = await GraphQL.graphql(
          schema,
          `
          mutation {
            dbCreateTable (name: "afunnytable", attributes: [
              { id: { idType: INT } },
              { string: { name: "testtext" } }
              { integer: { name: "testnumber" } }
            ]) {
              error {
                message
              } 
            }
          }`,
          null,
          {}
        );
        log.info(
          'mutationResult create:',
          JSON.stringify(mutationCreateResult, null, 4)
        );

        const metaSchemas = await MysqlSchemaReader(database.knex);
        const journal = MysqlSchemaJournalAdapters(metaSchemas);
        t.ok(journal.has('afunnytable'), 'has afunnytable');
      });

      await test.test('change table fields', async (t) => {
        const mutationCreateResult = await GraphQL.graphql(
          schema,
          `
          mutation {
            dbChangeTableFields (name: "afunnytable", attributes: [
              { string: { name: "testtext" } },
              { float: { name: "testnumber" } }
            ]) {
              error {
                message
              } 
            }
          }`,
          null,
          {}
        );
        log.info(
          'mutationResult create:',
          JSON.stringify(mutationCreateResult, null, 4)
        );

        const metaSchemas = await MysqlSchemaReader(database.knex);
        const journal = MysqlSchemaJournalAdapters(metaSchemas);
        t.ok(journal.has('afunnytable'), 'has afunnytable');
      });

      await test.test('rename table', async (t) => {
        const mutationRenameResult = await GraphQL.graphql(
          schema,
          `
          mutation {
            dbRenameTable (name: "afunnytable", newName: "amorefunnytable") {
              error {
                message
              } 
            }
          }`,
          null,
          {}
        );
        log.info(
          'mutationResult rename:',
          JSON.stringify(mutationRenameResult, null, 4)
        );

        const metaSchemas = await MysqlSchemaReader(database.knex);
        const journal = MysqlSchemaJournalAdapters(metaSchemas);
        t.ok(journal.has('afunnytable2'), 'has afunnytable2');
      });

      await test.test('delete table', async (t) => {
        const mutationDeleteResult = await GraphQL.graphql(
          schema,
          `
          mutation {
            dbDeleteTable (name: "amorefunnytable") {
              name,
              error {
                message
              } 
              
            }
          }`,
          null,
          {}
        );
        log.info(
          'mutationResult delete',
          JSON.stringify(mutationDeleteResult, null, 4)
        );
        const metaSchemas = await MysqlSchemaReader(database.knex);
        const journal = MysqlSchemaJournalAdapters(metaSchemas);
        t.notOk(journal.has('amorefunnytable'), 'table was deleted');
      });
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
      log.error(e);
      test.fail(e);
    } finally {
      test.end();
    }
  });
}

main();
