const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const log = require('mk-log');

const GraphqlSchemaBuilder = require('../lib/graphql-schema-builder.js');
const MongoSchemaJournalAdapters = require('../lib/db/mongo/mongo-schema-journal-adapters.js');
const MongoSchemaReader = require('../lib/db/mongo/mongo-schema-reader.js');
const GraphqlMongoResolveBuilder = require('../lib/resolvers/graphql-mongo-resolve-builder.js');
const DbToGraphqlTypesMap = require('../lib/utils/db-to-graphql-types-map');
const typesMap = DbToGraphqlTypesMap('mongo');
//const GraphqlSchemaBuilder = require('../lib/graphql-schema-builder.js');
const mongoFile = require('../mongofile.js');
const Database = require('../lib/db/mongo/database.js');

const app = express();
const port = 3010;

async function main() {
  try {
    const db = await Database(mongoFile);
    const metaSchemas = await MongoSchemaReader(db);
    const resolveBuilder = await GraphqlMongoResolveBuilder(db);
    const journal = MongoSchemaJournalAdapters(metaSchemas);
    const schemaBuilder = await GraphqlSchemaBuilder({
      resolveBuilder,
      journal,
      typesMap,
    });
    schemaBuilder.run();
    const schema = schemaBuilder.schema;

    /*
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
    */
    app.use(
      '/graphql',
      graphqlHTTP({
        schema,
        graphiql: true,
      })
    );

    app.listen(port, () => {
      log.info(`Server listening on port ${port}`);
    });
  } catch (err) {
    log.error(err);
  }
}

main();
