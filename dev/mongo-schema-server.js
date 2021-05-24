const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const graphql = require('graphql');
const log = require('mk-log');

const MongoSchemaAdapters = require('../lib/db/mongo/mongo-schema-adapters.js');
const MongoSchemaReader = require('../lib/db/mongo/mongo-schema-reader.js');
//const DbIndexReader = require('../lib/mongo-index-reader.js');
const GraphqlSchemaBuilder = require('../lib/graphql-schema-builder.js');
const mongoFile = require('../mongofile.js');
const Database = require('../lib/db/mongo/database.js');

const app = express();
const port = 3010;

async function main() {
  try {
    const client = await Database(mongoFile);
    const db = client.db(mongoFile.dbName);
    const metaSchemas = await MongoSchemaReader(db);
    /* 
    const journal = MongoSchemaAdapters(metaSchemas);
    const graphqlTypeBuilder = GraphqlSchemaBuilder(journal);
    graphqlTypeBuilder.tap.into('queryDef').with('global', (queryDef) => {
      log.info(queryDef);

      queryDef.fields['hello'] = {
        type: graphql.GraphQLString,
      };
    });
    graphqlTypeBuilder.run();
    const schema = graphqlTypeBuilder.schema;

    //log.info('schema', schema);

    app.get('/favicon.ico', (req, res) => {
      return res.status(200).send('');
    });

    const info = {
      hello: () => {
        return 'Hello world!';
      },
    };

    app.use(
      '/graphql',
      graphqlHTTP({
        schema,
        graphiql: true,
        rootValue: info,
      })
    );

    app.listen(port, () => {
      log.info(`Server listening on port ${port}`);
    });
    */
  } catch (err) {
    log.error(err);
  }
}

main();
