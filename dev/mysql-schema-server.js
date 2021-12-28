require('dotenv').config();
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const log = require('mk-log');

//const GraphQL = require('graphql');
const GraphqlMysqlSchemaBuilder = require('../lib/graphql-mysql-schema-builder.js');


const app = express();
const port = 3010;

async function main() {
  try {
    const schemaBuilder = await GraphqlMysqlSchemaBuilder();
    const schema = await schemaBuilder.run();


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
