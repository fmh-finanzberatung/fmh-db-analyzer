const tape = require('tape');
const log = require('mk-log');
const GraphQL = require('graphql');
const CommonGraphqlTypes = require('../../lib/graphql/common-types.graphql.js');
const GraphQLTypeBuilder = require('../../lib/graphql/builders/graphql-type-builder.js');
const Journal = require('../mockups/journal.mockup.js');
const MysqlGraphNodeSupport = require('../../lib/db/mysql/graph-node-support.js');

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

    journal.forEach((graphNode) => {
      const graphqlTypeBuilder = new GraphQLTypeBuilder(graphNode);
      graphqlTypeBuilder.createListInput({
        injectTypes: () => {},
        injectParams: () => {},
        attachToSchema: (key, obj) => {
          mutationFields[key] = obj;
        },
      });
      graphqlTypeBuilder.createItemInput({
        injectTypes: () => {},
        injectParams: () => {},
        attachToSchema: (key, obj) => {
          mutationFields[key] = obj;
        },
      });
      graphqlTypeBuilder.updateListInput({
        injectTypes: () => {},
        injectParams: () => {},
        attachToSchema: (key, obj) => {
          mutationFields[key] = obj;
        },
      });
      graphqlTypeBuilder.updateItemInput({
        injectTypes: () => {},
        injectParams: () => {},
        attachToSchema: (key, obj) => {
          mutationFields[key] = obj;
        },
      });
      graphqlTypeBuilder.deleteItemInput({
        injectTypes: () => {},
        injectParams: () => {},
        attachToSchema: (key, obj) => {
          mutationFields[key] = obj;
        },
      });
      graphqlTypeBuilder.deleteListInput({
        injectTypes: () => {},
        injectParams: () => {},
        attachToSchema: (key, obj) => {
          mutationFields[key] = obj;
        },
      });
      graphqlTypeBuilder.queryItemInput({
        injectTypes: () => {},
        injectParams: () => {},
        attachToSchema: (key, obj) => {
          log.info('key', key);
          log.info('obj', obj);

          queryFields[key] = obj;
        },
      });
      graphqlTypeBuilder.queryListInput({
        injectTypes: () => {},
        injectParams: () => {},
        attachToSchema: (key, obj) => {
          queryFields[key] = obj;
        },
      });
    });
    log.info('queryFields   ', queryFields);
    log.info('mutationFields', mutationFields);

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
          hello
          person {
            id
            name
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
      log.info('mutationResult', mutationResult);
      t.ok(mutationResult, 'mutationResult is ok');
    } catch (e) {
      t.fail(e);
    } finally {
      t.end();
    }
  });
}

main();
