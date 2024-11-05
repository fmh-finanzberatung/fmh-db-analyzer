import tape from 'tape';
import log from 'mk-log';
import GraphqlMysqlResolveBuilder from '../../lib/resolvers/graphql-mysql-resolve-builder.js';
import Knex from 'knex';
import knexfile from '../../knexfile.js';

const knex = Knex(knexfile); 

async function main() {
  tape('mysql resolve builder', async (t) => {
    try {
      const resolveBuilder = await GraphqlMysqlResolveBuilder(knex);

    } catch (err) {
      log.error(err);
    } finally {
      t.end();
      process.exit(0);
    }
  });
}

main();
