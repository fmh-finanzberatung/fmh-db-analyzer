const log = require('mk-log');
const GraphQL = require('graphql');
const CommonGraphqlTypes = require('../graphql/common-types.graphql.js');
const HashKey = require('../utils/hash-key.js');
const { merge } = require('webpack-merge');
const env = process.env.NODE_ENV || 'development';
const hashSalt = require(`../../config/env/${env}-config.js`).hashSalt;
const knexfile = require(`../../knexfile-${env}.js`);
const Knex = require('knex');
const CalC = require('../../lib/utils/cal-c.js');
const destructureDate = require('../../lib/utils/destructure-date.js');
const DbHelpers = require('../db/mysql/db-helpers.js');
const knex = Knex(knexfile);
const { insert } = DbHelpers(knex);
const RegistrationMailer = require('../mailers/registration.mailer.js');

const LoginOutputType = new GraphQL.GraphQLObjectType({
  name: 'LoginOutput',
  fields: {
    token: {
      type: GraphQL.GraphQLString,
    },
    error: {
      type: CommonGraphqlTypes.ErrorOutput,
    },
  },
});

const RegistrationOutputType = new GraphQL.GraphQLObjectType({
  name: 'RegistrationOutput',
  fields: {
    success: {
      type: CommonGraphqlTypes.SuccessOutput,
    },
    error: {
      type: CommonGraphqlTypes.ErrorOutput,
    },
  },
});

const RegistrationConfirmOutputType = new GraphQL.GraphQLObjectType({
  name: 'RegistrationConfirmOutput',
  fields: {
    success: {
      type: CommonGraphqlTypes.SuccessOutput,
    },
    error: {
      type: CommonGraphqlTypes.ErrorOutput,
    },
  },
});

const AuthenticationOutputType = new GraphQL.GraphQLObjectType({
  name: 'AuthenticationOutput',
  fields: {
    expiresAt: {
      type: CommonGraphqlTypes.DateTimeOutput,
    },
    error: {
      type: CommonGraphqlTypes.ErrorOutput,
    },
  },
});

module.exports = function DbAuthPlugin(optionArgs = {}) {
  //const secret = Uint8Array.from(hashSalt);

  const options = merge(
    {
      transport: null,
      config: null,
      user: {
        tableName: 'users',
        nameField: 'email',
        passwordField: 'hashed_password',
        confirmTokenField: 'confirm_token',
      },
      token: {
        tableName: 'sessions',
        tokenField: 'token',
        userIdField: 'user_id',
        timestampPrecision: 6,
      },
    },
    optionArgs
  );

  /*
    sentAt = new Date();
    const result = await registrationMailer.sendConfirmRegistration({
      // only avaialable in test config
      siteName: config.siteName,
      email: config.registration.user.email,
      registrationHost: config.registration.host,
      replyTo: config.registration.replyTo,
      subject: 'galt.de --test-- Registrierung bestätigen',
      link: `${config.registration.url}/token`,
    });
  */

  return function ({
    _journal,
    _metaSchemas,
    database,
    query = () => {},
    mutation = () => {},
  }) {
    const registrationMailer = RegistrationMailer(options.transport);
    const registerMutation = {
      type: RegistrationOutputType,
      args: {
        name: {
          type: GraphQL.GraphQLString,
        },
        password: {
          type: GraphQL.GraphQLString,
        },
      },
      resolve: async (_root, args, _context, _info) => {
        try {
          const { name, password } = args;

          const SQLUserQuery = `SELECT * FROM ${options.user.tableName} 
            WHERE  ${options.user.nameField} = "${name}" 
            LIMIT 1`;

          const rawResult = await database.knex.raw(SQLUserQuery);
          const rawUsersList = rawResult[0];
          const user = rawUsersList[0];

          if (user) {
            return {
              error: {
                code: 'USER_ALREADY_EXISTS',
                message: 'User already exists',
              },
            };
          }

          const hashedPassword = HashKey(password, { salt: hashSalt }).create();

          const createdUser = await insert({
            table: options.user.tableName,
            data: {
              [options.user.nameField]: name,
              [options.user.passwordField]: hashedPassword,
            },
          });

          const result = await registrationMailer.sendConfirmRegistration({
            // only avaialable in test config
            siteName: options.config.siteName,
            email: options.config.registration.user[options.user.nameField],
            registrationHost: options.config.registration.host,
            replyTo: options.config.registration.replyTo,
            subject: 'galt.de --test-- Please confirm your registration',
            link: `${options.config.registration.url}?token=${createdUser.confirm_token}`,
          });

          return {
            success: {
              code: 'USER_CREATED_SUCCESS',
              message: `User created. Mail was sent to ${result.envelope.to[0]}. Please check your inbox.`,
            },
          };
        } catch (error) {
          log.error(error);
          return { error: { message: 'Application Error' } };
        }
      },
    };

    const registerConfirmMutation = {
      type: RegistrationConfirmOutputType,
      args: {
        token: {
          type: GraphQL.GraphQLString,
        },
      },
      resolve: async (_root, args, _context, _info) => {
        const { token } = args;

        const SQLUserQuery = `SELECT * FROM ${options.user.tableName} 
          WHERE  ${options.user.confirmTokenField} = "${token}" 
          AND confirm_token_created_at > "${CalC(2)
            .hours.before()
            .date.toISOString()}"
          LIMIT 1`;

        const rawResult = await database.knex.raw(SQLUserQuery);
        //const rawUsersList = rawResult[0];
        //const user = rawUsersList[0];
        const user = rawResult?.[0]?.[0];

        if (!user) {
          return {
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found',
            },
          };
        }

        const updateResult = await knex(options.user.tableName)
          .update({
            confirmed: true,
            confirm_token: null,
            confirm_token_created_at: null,
          })
          .where({
            id: user.id,
          });

        await registrationMailer.sendCompletedRegistration({
          // only avaialable in test config
          siteName: options.config.siteName,
          email: options.config.registration.user.email,
          registrationHost: options.config.registration.host,
          replyTo: options.config.registration.replyTo,
          subject: `galt.de --test-- Welcome to ${options.config.siteName}`,
          loginUrl: `${options.config.login.url}`,
        });
        /*
        const createdUser = await insert({
          table: options.user.tableName,
          data: {
            [options.user.nameField]: name,
            [options.user.passwordField]: hashedPassword,
          },
        });
        */
      },
    };

    const loginMutation = {
      type: LoginOutputType,
      args: {
        name: {
          type: GraphQL.GraphQLString,
        },
        password: {
          type: GraphQL.GraphQLString,
        },
      },
      resolve: async (_root, args, _context, _info) => {
        try {
          const { name, password } = args;

          const hashedPassword = HashKey(password, { salt: hashSalt }).create();

          const SQLUserQuery = `SELECT * FROM ${options.user.tableName} 
            WHERE  ${options.user.nameField} = "${name}" 
            AND ${options.user.passwordField} = "${hashedPassword}" 
            LIMIT 1`;

          const rawResult = await database.knex.raw(SQLUserQuery);
          const rawUsersList = rawResult[0];
          const user = rawUsersList[0];

          if (user) {
            const createdSession = await insert({
              table: options.token.tableName,
              data: {
                user_id: user.id,
              },
            });

            return {
              token: createdSession.token,
            };
          }

          return {
            error: {
              code: 'LOGIN_FAILED',
              message: 'Login failed',
            },
          };
        } catch (error) {
          log.error(error);
          return { error: { message: 'Application Error' } };
        }
      },
    };

    const authenticateMutation = {
      type: AuthenticationOutputType,
      args: {
        permissions: {
          type: new GraphQL.GraphQLList(GraphQL.GraphQLString),
        },
        token: {
          type: GraphQL.GraphQLString,
        },
      },
      resolve: async (_root, args, _context, _info) => {
        try {
          const { token } = args;

          const SQLTokenQuery = `SELECT * FROM ${options.token.tableName} 
            WHERE  ${options.token.tokenField} = "${token}"
            AND created_at > "${CalC(2).hours.before().date.toISOString()}"
            ORDER  BY created_at DESC
            LIMIT 1`;

          const rawResult = await database.knex.raw(SQLTokenQuery);
          const tokenRecord = rawResult?.[0]?.[0];

          if (!tokenRecord) {
            return {
              error: {
                code: 'AUTHENTICATION_FAILED',
                message: 'Authentication failed',
              },
            };
          }

          if (tokenRecord) {
            const expirationDate = new Date();
            const tokenUpdateQuery = `UPDATE ${
              options.token.tableName
            } SET updated_at = ${database.knex.raw(
              `CURRENT_TIMESTAMP(${options.token.timestampPrecision})`
            )}
            WHERE id = ${tokenRecord.id}`;
            log.info('tokenUpdateQuery', tokenUpdateQuery);
            const updateResult = await knex.raw(tokenUpdateQuery);
            log.info('updateResult', updateResult);
            return {
              expiresAt: destructureDate(expirationDate),
            };
          }
        } catch (error) {
          log.error(error);
          return { error: { message: 'Application Error' } };
        }
      },
    };

    mutation('register', registerMutation);
    mutation('registerConfirm', registerConfirmMutation);
    mutation('login', loginMutation);
    mutation('authenticate', authenticateMutation);
  };
};
