import tape from 'tape';
import log from 'mk-log';
import GraphQL from 'graphql';
import GraphqlMysqlSchemaBuilder from '../lib/graphql-mysql-schema-builder.js';
import knexfile from '../knexfile-test.js';
import Knex from 'knex';
import MysqlSchemaReader from '../lib/db/mysql/mysql-schema-reader.js';
import MysqlSchemaJournalAdapters from '../lib/db/mysql/mysql-schema-journal-adapters.js';

log.info('knexfile:', knexfile);

const knex = Knex(knexfile);

async function main() {
  tape(async (test) => {
    try {
      const schemaBuilder = await GraphqlMysqlSchemaBuilder(knex);
      const schema = await schemaBuilder.run();

      test.test('create table', async (t) => {
        log.info('schema:', schema);
        const mutationCreateResult = await GraphQL.graphql({
          schema,
          source: `
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
        });
        log.info(
          'mutationResult create:',
          JSON.stringify(mutationCreateResult, null, 4)
        );

        const metaSchemas = await MysqlSchemaReader(knex);
        const journal = MysqlSchemaJournalAdapters(metaSchemas);
        t.ok(journal.has('afunnytable'), 'has afunnytable');
      });

      /*
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
      */
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
