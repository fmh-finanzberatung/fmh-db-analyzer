const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const graphql = require('graphql');
const log = require('mk-log');

const GraphqlMysqlSchemaBuilder = require('../lib/graphql-mysql-schema-builder.js');
const knexfile = require('../knexfile.js');

const app = express();
const port = 3010;

async function main() {
  try {
    const schemaBuilder = await GraphqlMysqlSchemaBuilder(knexfile);
    schemaBuilder.run();
    const schema = schemaBuilder.schema;

    // log.info('schema', schema);

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
