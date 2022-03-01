const log = require('mk-log');
const GraphQL = require('graphql');
const CommonGraphqlTypes = require('../graphql/common-types.graphql.js');
const hashKey = require('../utils/hash-key.js');
const env = process.env.NODE_ENV || 'development';
const hashSalt = require(`../../config/env/${env}-config.js`).hashSalt;
const { SignJWT } = require('jose');

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

module.exports = function DbAuthPlugin(
  options = {
    tableName: 'users',
    nameField: 'email',
    passwordField: 'hashed_password',
  }
) {
  return function ({
    _journal,
    _metaSchemas,
    database,
    query = () => {},
    _mutation = () => {},
  }) {
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

          const hashedPassword = hashKey(password).create(hashSalt);

          const SQLUserQuery = `SELECT * FROM ${options.tableName} 
            WHERE  ${options.nameField} = "${name}" 
            AND ${options.passwordField} = "${hashedPassword}" 
            LIMIT 1`;

          const SQLQuery = `SELECT * FROM ${options.tableName} 
            WHERE  ${options.nameField} = "${name}" 
            AND ${options.passwordField} = "${hashedPassword}" 
            LIMIT 1`;

          log.info('SQLUserQuery', SQLUserQuery);
          const rawResult = await database.knex.raw(SQLUserQuery);
          const rawUsersList = rawResult[0];
          const user = rawUsersList[0];

          console.log(jwt);
          //log.info('rawResult', rawResult);

          if (user) {
            log.info('user id', user.id);
            const SQLSessionInsertQuery = `INSERT INTO sessions (user_id, token) VALUES (${
              user.id
            }, "${jwt.sign({ user_id: user.id }, 'secret')}")`;
            log.info('SQLQuery', SQLSessionInsertQuery);
            const jwt = await new SignJWT()
              .setProtectedHeader({ alg: 'HS256' })
              .sign(hashSalt);

            const rawCreatedResult = await database.knex.raw(
              SQLSessionInsertQuery
            );

            log.info('rawCreatedResult', rawCreatedResult);

            return {
              token: jwt,
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
    query('login', loginQuery);
  };
};
