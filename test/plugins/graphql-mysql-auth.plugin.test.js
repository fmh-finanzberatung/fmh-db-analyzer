const tape = require('tape');
const log = require('mk-log');
const GraphQL = require('graphql');
const { ImapFlow } = require('imapflow');
const config = require('../../config/env/test-config.js');
const GraphqlMysqlSchemaBuilder = require('../../lib/graphql-mysql-schema-builder.js');
const PluginManager = require('../../lib/utils/plugin-manager.js');
const env = 'test';
const Knex = require('knex');
const knexConfig = require('../../knexfile.js');
const knex = Knex(knexConfig);

function registerQueryCode({ name, password }) {
  return `
    mutation {
      register (
        name: "${name}",
        password: "${password}" 
      ) {
        success {
          code,
          message
        },
        error {
          code,
          message
        }
      }
    }
  `;
}

// using seed data

function loginQueryCode({ name, password }) {
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
    // path relative to root
    const pluginManager = PluginManager('./lib/plugins');
    pluginManager.addPluginConfigOptions('login', {
      tableName: 'users',
      nameField: 'email',
      passwordField: 'hashed_password',
    });

    const schemaBuilder = await GraphqlMysqlSchemaBuilder(pluginManager);
    const schema = await schemaBuilder.run();
    await knex('users').where('email', 'register@galt.de').del();
    await test.test('successful registration', async (t) => {
      try {
        const registerQueryResult = await GraphQL.graphql({
          schema,
          source: registerQueryCode({
            name: 'register@galt.de',
            password: '3333',
          }),
        });
        log.info(
          'registerQueryResult',
          JSON.stringify(registerQueryResult, null, 4)
        );
        const code = registerQueryResult.data.register?.success?.code;
        log.info('code:', code);
        t.equals(code, 'USER_CREATED_SUCCESS');
      } catch (e) {
        log.error(e);
        t.fail(e);
      } finally {
        t.end();
      }
    });

    await test.test('successful registration confirmation mail', async (t) => {
      let lock;
      try {
        const client = new ImapFlow(config.imapOptions);
        await client.connect();
        // Select and lock a mailbox. Throws if mailbox does not exist
        lock = await client.getMailboxLock('INBOX');
        // fetch latest message source
        // client.mailbox includes information about currently selected mailbox
        // "exists" value is also the largest sequence
        // number available in the mailbox
        const message = await client.fetchOne(client.mailbox.exists, {
          source: true,
        });
        log.info('***********', message.source.toString());

        // list subjects for all messages
        // uid value is always included in FETCH response,
        // envelope strings are in unicode.
        for await (let message of client.fetch('1:*', { envelope: true })) {
          log.info(`************* ${message.uid}`, message.envelope.subject);
        }

        // log out and close connection
        await client.logout();
      } catch (e) {
        log.error(e);
        t.fail(e);
      } finally {
        // Make sure lock is released, otherwise next `getMailboxLock()` never returns
        lock.release();
        t.end();
      }
    });

    await test.test('failed registration - user exists', async (t) => {
      try {
        const registerQueryResult = await GraphQL.graphql({
          schema,
          source: registerQueryCode({
            name: 'register@galt.de',
            password: '3333',
          }),
        });
        log.info(
          'registerQueryResult',
          JSON.stringify(registerQueryResult, null, 4)
        );
        const code = registerQueryResult.data.register?.error?.code;
        log.info('code:', code);
        t.equals(code, 'USER_ALREADY_EXISTS');
      } catch (e) {
        log.error(e);
        t.fail(e);
      } finally {
        t.end();
      }
    });
    /*
    await test.test('successful login', async (t) => {
      try {
        const loginQueryResult = await GraphQL.graphql({
          schema,
          source: loginQueryCode({
            name: 'master@galt.de',
            password: '3333',
          }),
        });
        //log.info('loginQueryResult', loginQueryResult);
        const token = loginQueryResult.data.login.token;
        //log.info('token\n', token);
        t.ok(token);
      } catch (e) {
        log.error(e);
        t.fail(e);
      } finally {
        t.end();
      }
    });

    await test.test('failed login', async (t) => {
      try {
        const loginQueryResult = await GraphQL.graphql({
          schema,
          source: loginQueryCode({
            name: 'wrongName',
            password: 'wrongPassword',
          }),
        });
        t.equals(loginQueryResult.data.login.error.code, 'LOGIN_FAILED');
      } catch (e) {
        log.error(e);
        t.fail(e);
      } finally {
        t.end();
      }
    });
    */
  });
}

main();
