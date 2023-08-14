const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const graphql = require('graphql');
const log = require('mk-log');

const app = express();
const port = 3010;

async function main() {
  try {
    const UserType = new graphql.GraphQLObjectType({
      name: 'User',
      fields: {
        givenName: { type: graphql.GraphQLString },
        familyName: { type: graphql.GraphQLString },
        city: { type: graphql.GraphQLString },
      },
    });
    const queryDef = new graphql.GraphQLObjectType({
      name: 'Query',
      fields: {
        hello: {
          type: graphql.GraphQLString,
        },
        user: {
          type: UserType,
          args: {
            id: { type: graphql.GraphQLID },
            givenName: { type: graphql.GraphQLString },
            familyName: { type: graphql.GraphQLString },
          },
          resolve: (parent, args, context, info) => {
            //log.info('parent', parent);
            //log.info('args', args);
            //log.info('context', context);

            log.info('run analyzer');

            //log.info('info', info);
            //log.info('info.fieldNodes', info.fieldNodes);
            //log.info(
            //  'info.fieldNodes.selectionSet',
            //  info?.fieldNodes?.selectionSet?.selections
            //);
            //const selections = info?.fieldNodes?.selectionSet?.selections;
            //if (selections) {
            //  selections.forEach( ses  )
            //}

            return {
              givenName: '1test',
            };
          },
        },
      },
    });

    const schema = new graphql.GraphQLSchema({ query: queryDef });

    log.info('schema', schema);

    const root = {
      hello: () => {
        return 'Hello world!';
      },
    };

    app.get('/favicon.ico', (req, res) => {
      return res.status(200).send('');
    });

    app.use(
      '/graphql',
      graphqlHTTP({
        schema,
        rootValue: root,
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
