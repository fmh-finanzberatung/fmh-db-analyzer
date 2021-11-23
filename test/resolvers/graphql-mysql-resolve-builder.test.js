const tape = require('tape');
const log = require('mk-log');
const GraphqlMysqlResolveBuilder = require('../../lib/resolvers/graphql-mysql-resolve-builder.js');
const knexfile = require('../../knexfile.js');

async function main() {
  await tape('mysql resolve builder', async (t) => {
    try {
      const resolveBuilder = await GraphqlMysqlResolveBuilder(knexfile);


    } catch (err) {
      log.error(err);
    } finally {
      t.end();
      process.exit(0);
    }
  });
}

main();

