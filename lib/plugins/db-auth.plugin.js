const log = require('mk-log');
const GraphQL = require('graphql');
const CommonGraphqlTypes = require('../graphql/common-types.graphql.js');
const HashKey = require('../utils/hash-key.js');
const env = process.env.NODE_ENV || 'development';
const hashSalt = require(`../../config/env/${env}-config.js`).hashSalt;
const knexfile = require(`../../knexfile-${env}.js`);
const Knex = require('knex');
const { SignJWT } = require('jose');
const DbHelpers = require('../db/mysql/db-helpers.js');
const knex = Knex(knexfile);
const { insert } = DbHelpers(knex);

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

module.exports = function DbAuthPlugin(
  options = {
    tableName: 'users',
    nameField: 'email',
    passwordField: 'hashed_password',
  }
) {
  //const secret = Uint8Array.from(hashSalt);

  return function ({
    _journal,
    _metaSchemas,
    database,
    query = () => {},
    mutation = () => {},
  }) {
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
          log.info('args', args);
          const { name, password } = args;

          log.info('password', password);
          log.info('hashSalt', hashSalt);

          const SQLUserQuery = `SELECT * FROM ${options.tableName} 
            WHERE  ${options.nameField} = "${name}" 
            LIMIT 1`;

          log.info('SQLUserQuery', SQLUserQuery);
          const rawResult = await database.knex.raw(SQLUserQuery);
          const rawUsersList = rawResult[0];
          const user = rawUsersList[0];

          log.info('user', user);

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
            table: options.tableName,
            data: {
              [options.nameField]: name,
              [options.passwordField]: hashedPassword,
            },
          });

          log.info('createdUser', createdUser);

          return {
            success: {
              code: 'USER_CREATED_SUCCESS',
              message: 'User created',
            },
          };
        } catch (error) {
          log.error(error);
          return { error: { message: 'Application Error' } };
        }
      },
    };

    const loginQuery = {
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
          log.info('args', args);
          const { name, password } = args;

          log.info('password', password);
          log.info('hashSalt', hashSalt);

          const hashedPassword = HashKey(password, { salt: hashSalt }).create();
          const SQLUserQuery = `SELECT * FROM ${options.tableName} 
            WHERE  ${options.nameField} = "${name}" 
            AND ${options.passwordField} = "${hashedPassword}" 
            LIMIT 1`;

          //log.info('SQLUserQuery', SQLUserQuery);
          const rawResult = await database.knex.raw(SQLUserQuery);
          const rawUsersList = rawResult[0];
          const user = rawUsersList[0];

          //console.log(jwt);
          //log.info('rawResult', rawResult);

          if (user) {
            //log.info('user id', user.id);
            const createdSession = await insert({
              table: 'sessions',
              data: {
                user_id: user.id,
              },
            });

            // log.info('createdSession', createdSession);

            return {
              token: createdSession.key,
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
    mutation('register', registerMutation);
    query('login', loginQuery);
  };
};
