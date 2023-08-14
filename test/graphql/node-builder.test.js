const tape = require('tape');
const log = require('mk-log');
const GraphQL = require('graphql');
// const buildNodeType = require('../../lib/graphql/builders/build-node-type.js');
const GraphQLTypeBuilder = require('../../lib/graphql/builders/type-builder.js');
const Journal = require('../mockups/journal.mockup.js');
const MysqlGraphNodeSupport = require('../../lib/db/mysql/graph-node-support.js');
//const CommonGraphqlTypes = require('../../lib/graphql/common-types.graphql.js');

async function main() {
  tape(async (t) => {
    const mutationFields = {};
    const queryFields = {
      hello: {
        type: GraphQL.GraphQLString,
        resolve: () => 'world',
      },
    };
    const outputTypes = {};
    const journal = Journal(MysqlGraphNodeSupport);

    // continue here
    // store output types in a map
    // so they are not duplicated
    const outputTypesMap = new Map();
    const inputTypesMap = new Map();

    journal.forEach((graphNode) => {
      GraphQLTypeBuilder(graphNode, {
        inputTypesMap,
        outputTypesMap,
        onQuery(key, field) {
          queryFields[key] = field;
        },
        onMutation(key, field) {
          mutationFields[key] = field;
        },
        onType(key, type) {
          outputTypes[key] = type;
        },
      });
    });

    log.info('mutationFields', mutationFields);

    const schema = new GraphQL.GraphQLSchema(
      Object.assign(
        {},
        {
          outputTypes,
          query: new GraphQL.GraphQLObjectType({
            name: 'Query',
            fields: queryFields,
          }),
          mutation: new GraphQL.GraphQLObjectType({
            name: 'Mutation',
            fields: mutationFields,
          }),
        }
      )
    );

    try {
      const queryResult = await GraphQL.graphql({
        schema,
        source: `
        query {
          # hello
          companies {
            docs {
              id
            } 
          }
          company {
            children {
              docs {
                id
                name
              }
            } 
          }  
        }`,
      });
      log.info('queryResult', queryResult);
      /*
      const queryResult = await GraphQL.graphql(
        schema,
        `
        query {
          hello
          person {
            id
          }
          personList {
            error {
              message
            } 
          }
          company {
            children {
              docs {
                id
              }
            }
            error {
              message
            } 
          }
        }
      `
      );
      log.info('queryResult', queryResult);
      t.ok(queryResult, 'queryResult is ok');
      const mutationResult = await GraphQL.graphql(
        schema,
        `
        mutation {
         createPersonList {
            id
            name
          }
        }
      `
      );
      t.ok(mutationResult, 'mutationResult is ok');
      */
    } catch (e) {
      t.fail(e);
    } finally {
      t.end();
    }
  });
}

main();
