import express from 'express';
import log from 'mk-log';
import { createHandler } from 'graphql-http/lib/use/express';
//const GraphQL = require('graphql');
import GraphqlMysqlSchemaBuilder from '../lib/graphql-mysql-schema-builder.js';
import PluginManager from '../lib/utils/plugin-manager.js';
import cors from 'cors';
const app = express();
const port = 3010;
import Knex from 'knex';
import knexConfig from '../knexfile.js';
const knex = Knex(knexConfig);

async function main() {
  try {
    // ./lib/plugins/none does not exist, so no plugins will be loaded
    const pluginManager = await PluginManager('./lib/plugins/none');
    pluginManager.addPluginConfigOptions('login', {
      tableName: 'users',
      nameField: 'email',
      passwordField: 'hashed_password',
    });

    /* 
    knex.on('query', (query) => {
      log.info('knex SQL:', query.sql);
    });
    */
    const schemaBuilder = await GraphqlMysqlSchemaBuilder(knex, pluginManager);
    const schema = await schemaBuilder.run();
    //log.info('schema', {schema});
    const handler = createHandler({ schema, context: () => ({}) });
    //const handler = createHandler({ schema, context: {} });
    app.use(cors());
    app.all('/graphql', handler);

    // Add this code after setting up the GraphQL endpoint

    // Serve GraphiQL 2 interface

    app.get('/favicon.ico', (req, res) => {
      return res.status(200).send('');
    });

    //log.info('schema', schema);

    app.listen(port, () => {
      log.info(`Server listening on port ${port}`);
    });
  } catch (err) {
    log.error(err);
  }
}

main();
