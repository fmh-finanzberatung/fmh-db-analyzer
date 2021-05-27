const tape = require('tape');
const knexFile = require('../knexfile.js');
const knex = require('knex')(knexFile);
const log = require('mk-log');

const MysqlSchemaAdapters = require('../lib/db/mysql/mysql-schema-adapters.js');
const MysqlSchemaReader = require('../lib/db/mysql/mysql-schema-reader.js');
const GraphqlTypeBuilder = require('../lib/graphql-type-builder.js');
const { graphql } = require('graphql');

async function main() {
  await tape(async (t) => {
    try {
      

      log.warn('This test needs an implementation');

      //t.plan(1);
      //const metaSchemas = await MysqlSchemaReader(knex);
      //const journal = MysqlSchemaAdapters(metaSchemas);
      //journal.forEach((node) => {
      //    const graphqlTypeBuilder = GraphqlTypeBuilder(node);

      /*      
      let res = await graphql(
        graphqlSchema,
        'query {car ( make: "Not a Tesla" ) {id} }'
      );
      */

    } catch (err) {
      log.error(err);
    } finally {
      t.end();
      process.exit(0);
    }
  });
}

main();
