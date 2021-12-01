require('dotenv').config();
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const log = require('mk-log');

const GraphqlMysqlResolveBuilder = require('../lib/resolvers/graphql-mysql-resolve-builder.js');
const MysqlSchemaAdapters = require('../lib/db/mysql/mysql-schema-journal-adapters.js');
const MysqlSchemaReader = require('../lib/db/mysql/mysql-schema-reader.js');
const DbToGraphqlTypesMap = require('../lib/utils/db-to-graphql-types-map');
const typesMap = DbToGraphqlTypesMap('mysql');

const GraphqlSchemaBuilder = require('../lib/graphql-schema-builder.js');
const knexfile = require('../knexfile.js');
const Database = require('../lib/db/mysql/database');

const app = express();
const port = 3010;

async function main() {
  try {
    const { knex } = Database(knexfile);
    // mysqlspecific:
    // ResolveBuilder, SchemaReader and SchemaAdapters
    const resolveBuilder = await GraphqlMysqlResolveBuilder(knexfile);
    const mysqlMetaSchemas = await MysqlSchemaReader(knex);
    const journal = MysqlSchemaAdapters(mysqlMetaSchemas);
    // db agnostic from here on
    const schemaBuilder = await GraphqlSchemaBuilder({
      resolveBuilder,
      journal,
      typesMap,
    });
    schemaBuilder.run();
    const schema = schemaBuilder.schema;

    //log.info('schema', schema);

    app.get('/favicon.ico', (req, res) => {
      return res.status(200).send('');
    });

    //log.info('schema', schema);

    app.use(
      '/graphql',
      graphqlHTTP({
        schema,
        graphiql: true,
      })
    );

    app.use('/graphql', (req, res) => res.end());

    app.listen(port, () => {
      log.info(`Server listening on port ${port}`);
    });
  } catch (err) {
    log.error(err);
  }
}

main();
