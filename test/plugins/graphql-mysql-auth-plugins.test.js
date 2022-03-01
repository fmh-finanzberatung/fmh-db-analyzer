const tape = require('tape');
const log = require('mk-log');
const GraphQL = require('graphql');
const GraphqlMysqlSchemaBuilder = require('../../lib/graphql-mysql-schema-builder.js');
const PluginManager = require('../../lib/utils/plugin-manager.js');
const env = 'test';

// using seed data

function queryCode({ name, password }) {
  return `{
    login (
      name: "${name}",
      password: "${password}" 
    ) {
      token,
      error {
        code,
        message
      }
    }
  }`;
}

async function main() {
  await tape('auth', async (test) => {
    try {
      // path relative to root
      const pluginManager = PluginManager('./lib/plugins');
      pluginManager.addPluginConfigOptions('login', {
        tableName: 'users',
        nameField: 'email',
        passwordField: 'hashed_password',
      });

      const schemaBuilder = await GraphqlMysqlSchemaBuilder(pluginManager);
      const schema = await schemaBuilder.run();

      await test.test('failed login', async (t) => {
        const loginQueryResult = await GraphQL.graphql({
          schema,
          source: queryCode({ name: 'wrongName', password: 'wrongPassword' }),
        });
        t.equals(loginQueryResult.data.login.error.code, 'LOGIN_FAILED');
        t.end();
      });

      await test.test('successful login', async (t) => {
        const loginQueryResult = await GraphQL.graphql({
          schema,
          source: queryCode({ name: 'master@galt.de', password: '3333' }),
        });
        t.equals(loginQueryResult.data.login.token, 'token');
        t.end();
      });
    } catch (e) {
      log.error(e);
      //test.fail(e);
    } finally {
      test.end();
    }
  });
}

main();
