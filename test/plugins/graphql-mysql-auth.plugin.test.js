const tape = require('tape');
const log = require('mk-log');
const GraphQL = require('graphql');
const { ImapFlow } = require('imapflow');
const pino = require('pino')();
const config = require('../../config/env/test-config.js');
const NodeMailer = require('nodemailer');
const transport = NodeMailer.createTransport(config.transportOptions);
const GraphqlMysqlSchemaBuilder = require('../../lib/graphql-mysql-schema-builder.js');
const PluginManager = require('../../lib/utils/plugin-manager.js');
const Knex = require('knex');
const knexConfig = require('../../knexfile.js');
const knex = Knex(knexConfig);
const Mailbox = require('../mailers/utils/mailbox.js');
const imapOptions = config.imapOptions;
const extractQsToken = require('../../lib/utils/extract-qs-token.js');

function registerMutationCode({ name, password }) {
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

function registerConfirmMutationCode({ token }) {
  return `
    mutation {
      registerConfirm (
        token: "${token}" 
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

function loginMutationCode({ name, password }) {
  return `mutation {
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

function authenticateMutationCode({ token }) {
  return `mutation {
    authenticate (
      token: "${token}",
    ) {
      expiresAt {
        year,
        month,
        hour,
        minute,
        second,
      }
      error {
        code,
        message
      }
    }
  }`;
}

async function cleanUpMailbox() {
  let mailbox; 
  try { 
    mailbox = await Mailbox(imapOptions);
  } catch (e) {
    log.error('mailbox.delete.all', e);
  } finally {
    mailbox.release();
  }
}

async function main() {
 
  await cleanUpMailbox();

  await tape('auth plugin', async (test) => {
    // path relative to root
    const pluginManager = PluginManager('./lib/plugins');

    pluginManager.addPluginConfigOptions('db-auth', {
      transport,
      config,
      user: {
        tableName: 'users',
        nameField: 'email',
        passwordField: 'hashed_password',
        confirmKeyField: 'confirm_key',
      },
      session: {
        tableName: 'sessions',
        tokenField: 'key',
        twoFaKey: 'two_fa_key',
      },
    });

    const schemaBuilder = await GraphqlMysqlSchemaBuilder(pluginManager);
    const schema = await schemaBuilder.run();
    await knex('users').where('email', 'test@galt.de').del();

    await test.test('successful registration', async (t) => {
      try {
        // creates an unconfirmed user record
        // and sends a confirmation email
        // with token link
        const registerQueryResult = await GraphQL.graphql({
          schema,
          source: registerMutationCode({
            name: 'test@galt.de',
            password: '3333',
          }),
        });
        const code = registerQueryResult.data.register?.success?.code;
        t.equals(code, 'USER_CREATED_SUCCESS');
      } catch (e) {
        log.error(e);
        t.fail(e);
      } finally {
        t.end();
      }
    });

    await test.test('failed registration user exists', async (t) => {
      try {
        // creates an unconfirmed user record
        // and sends a confirmation email
        // with token link
        const registerQueryResult = await GraphQL.graphql({
          schema,
          source: registerMutationCode({
            name: 'test@galt.de',
            password: '3333',
          }),
        });
        const code = registerQueryResult.data.register?.error?.code;
        t.equals(code, 'USER_ALREADY_EXISTS');
      } catch (e) {
        log.error(e);
        t.fail(e);
      } finally {
        t.end();
      }
    });

    await test.test('successful registration confirmation mail', async (t) => {
      let mailbox;
      try {
        mailbox = await Mailbox(imapOptions);

        const mail = await mailbox.fetch.one();

        t.ok(mail.text, 'confirmation toke mail contains text');

        // expecting url either as querystring param or
        const token =  extractQsToken(mail.text);

        t.ok(token, 'mail provides token');

        // deleting confirmation mail
        await mailbox.delete.all();

        mailbox.release();

        const registerConfirmQueryResult = await GraphQL.graphql({
          schema,
          source: registerConfirmMutationCode({
            token
          }),
        });
        
        
        mailbox = await Mailbox(imapOptions);

        const welcomeMail = await mailbox.fetch.one();

        t.ok(welcomeMail.text, 'confirmation welcome mail contains text');
        t.ok(welcomeMail.text.match(/login/), 'mail contains login link');
        
        await mailbox.delete.all();

      } catch (e) {
        log.error(e);
        t.fail(e);
      } finally {
        // Make sure lock is released, otherwise next `getMailboxLock()` never returns
        mailbox.release();
        t.end();
      }
    });

    await test.test('failed registration - user exists', async (t) => {
      try {
        const registerQueryResult = await GraphQL.graphql({
          schema,
          source: registerMutationCode({
            name: 'register@galt.de',
            password: '3333',
          }),
        });
        const code = registerQueryResult.data.register?.error?.code;
        t.equals(code, 'USER_ALREADY_EXISTS');
      } catch (e) {
        log.error(e);
        t.fail(e);
      } finally {
        t.end();
      }
    });

    await test.test('successful login and authentication', async (t) => {
      try {
        const loginMutationResult = await GraphQL.graphql({
          schema,
          source: loginMutationCode({
            name: 'test@galt.de',
            password: '3333',
          }),
        });
        const token = loginMutationResult.data.login.token;
        t.ok(token);

        const authenticateMutationResult = await GraphQL.graphql({
          schema,
          source: authenticateMutationCode({
            token
          }),
        });

        log.info('authenticateMutationResult', authenticateMutationResult);
        const expiresAt = authenticateMutationResult.data.authenticate.expiresAt;
        t.ok(expiresAt);

      } catch (e) {
        log.error(e);
        t.fail(e);
      } finally {
        t.end();
      }
    });

    await test.test('failed login', async (t) => {
      try {
        const loginMutationResult = await GraphQL.graphql({
          schema,
          source: loginMutationCode({
            name: 'wrongName',
            password: 'wrongPassword',
          }),
        });

        t.equals(loginMutationResult.data.login.error.code, 'LOGIN_FAILED');
      } catch (e) {
        log.error(e);
        t.fail(e);
      } finally {
        log.info('faild login test.end');
        t.end();
      }
    });
    test.ok(true, 'test end');
    test.end();
  });
}

main();
