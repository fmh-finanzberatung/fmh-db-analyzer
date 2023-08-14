const tape = require('tape');
const log = require('mk-log');
const GraphqlMysqlResolveBuilder = require('../../lib/resolvers/graphql-mysql-resolve-builder.js');
const knexfile = require('../../knexfile.js');
const database = require('../../lib/db/mysql/database.js')(knexfile);

async function main() {
  tape('mysql resolve builder', async (t) => {
    try {
      const resolveBuilder = await GraphqlMysqlResolveBuilder(database);
    } catch (err) {
      log.error(err);
    } finally {
      t.end();
      process.exit(0);
    }
  });
}

main();
