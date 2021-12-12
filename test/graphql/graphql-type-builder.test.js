const tape = require('tape');
const log = require('mk-log');
const GraphQL = require('graphql');
// const CommonGraphqlTypes = require('../../lib/graphql/common-types.graphql.js');
const GraphQLTypeBuilder = require('../../lib/graphql/builders/graphql-type-builder.js');
const Journal = require('../mockups/journal.mockup.js');
const MysqlGraphNodeSupport = require('../../lib/db/mysql/graph-node-support.js');

function buildNodeType(graphNode, { attachToQuery, attachToMutation }) {
  const graphqlTypeBuilder = new GraphQLTypeBuilder(graphNode);
  graphqlTypeBuilder.createListInput({
    injectTypes: () => {},
    injectParams: () => {},
    attachToSchema: (key, obj) => {
      attachToMutation(key, obj);
    },
  });
  graphqlTypeBuilder.createItemInput({
    injectTypes: () => {},
    injectParams: () => {},
    attachToSchema: (key, obj) => {
      attachToMutation(key, obj);
    },
  });
  graphqlTypeBuilder.updateListInput({
    injectTypes: () => {},
    injectParams: () => {},
    attachToSchema: (key, obj) => {
      attachToMutation(key, obj);
    },
  });
  graphqlTypeBuilder.updateItemInput({
    injectTypes: () => {},
    injectParams: () => {},
    attachToSchema: (key, obj) => {
      attachToMutation(key, obj);
    },
  });
  graphqlTypeBuilder.deleteItemInput({
    injectTypes: () => {},
    injectParams: () => {},
    attachToSchema: (key, obj) => {
      attachToMutation(key, obj);
    },
  });
  graphqlTypeBuilder.deleteListInput({
    injectTypes: () => {},
    injectParams: () => {},
    attachToSchema: (key, obj) => {
      attachToMutation(key, obj);
    },
  });
  graphqlTypeBuilder.queryItemInput({
    injectTypes: () => {},
    injectParams: () => {},
    attachToSchema: (key, obj) => {
      attachToQuery(key, obj);
    },
  });
  graphqlTypeBuilder.queryListInput({
    injectTypes: () => {},
    injectParams: () => {},
    attachToSchema: (key, obj) => {
      attachToQuery(key, obj);
    },
  });
}

async function main() {
  await tape(async (t) => {
    const mutationFields = {};
    const queryFields = {
      hello: {
        type: GraphQL.GraphQLString,
        resolve: () => 'world',
      },
    };

    const journal = Journal(MysqlGraphNodeSupport);

    // continue here
    // store output types in a map
    // so they are not duplicated
    const outputTypes = {};

    journal.forEach((graphNode) => {
      graphNode.edges().forEach((edgeName) => {
        const edgeNode = journal.get(edgeName);
        buildNodeType(edgeNode, {
          attachToQuery(key, obj) {
            queryFields[key] = obj;
          },
          attachToMutation(key, obj) {
            mutationFields[key] = obj;
          },
        });
      });
      buildNodeType(graphNode, {
        attachToQuery(key, obj) {
          queryFields[key] = obj;
        },
        attachToMutation(key, obj) {
          mutationFields[key] = obj;
        },
      });
      //log.info('graph node edges', graphNode.edges());
    });

    const schema = new GraphQL.GraphQLSchema(
      Object.assign(
        {},
        {
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

    log.info('schema', schema);

    try {
      const queryResult = await GraphQL.graphql(
        schema,
        `
        query {
          # hello
          company {
            children {
              docs {
                id
                name
              }
            } 
          }  
        }`
      );
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
