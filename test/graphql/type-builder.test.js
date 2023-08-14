const tape = require('tape');
const log = require('mk-log');
const GraphQL = require('graphql');
// const buildNodeType = require('../../lib/graphql/builders/build-node-type.js');
const PersonTableDef = require('../mockups/person-table-def.mockup.js');
const MysqlGraphNodeSupport = require('../../lib/db/mysql/graph-node-support.js');
const GraphNode = require('../../lib/graph-node/graph-node.js');
// const NodeTypeBuilder = require('../../lib/graphql/builders/node-type-builder.js');
const TypeBuilder = require('../../lib/graphql/builders/type-builder.js');

//const CommonGraphqlTypes = require('../../lib/graphql/common-types.graphql.js');

async function main() {
  await tape(async (t) => {
    //log.info('MysqlGraphNodeSupport', MysqlGraphNodeSupport);

    log.info('PersonTableDef', PersonTableDef);

    const graphNode = GraphNode(
      'persons',
      PersonTableDef,
      MysqlGraphNodeSupport
    );

    const inputArgs = {};
    const outputFields = {};
    const typeBuilder = TypeBuilder(graphNode);
    const domesticInputTypes = typeBuilder.domesticTypes('Input');
    const searchInputType = typeBuilder.searchType('Input');
    const excludeInputType = typeBuilder.excludeType('Input');
    const orderInputType = typeBuilder.orderType('Input');
    const rangeInputType = typeBuilder.rangeType('Input');
    const domesticOutputTypes = typeBuilder.domesticTypes('Output');

    domesticInputTypes.forEach((gqlType, fieldName) => {
      inputArgs[fieldName] = {
        type: gqlType,
      };
    });

    searchInputType.one((gqlType) => {
      inputArgs.search = {
        type: gqlType,
      };
    });

    excludeInputType.one((gqlType) => {
      inputArgs.exclude = {
        type: gqlType,
      };
    });

    rangeInputType.one((gqlType) => {
      inputArgs.range = {
        type: gqlType,
      };
    });

    orderInputType.one((gqlType) => {
      inputArgs.order = {
        type: gqlType,
      };
    });

    domesticOutputTypes.forEach((gqlType, fieldName) => {
      outputFields[fieldName] = {
        type: gqlType,
      };
    });

    log.info('inputArgs', inputArgs);

    const Person = new GraphQL.GraphQLObjectType({
      name: 'Person',
      description: '',
      args: inputArgs,
      fields: () => outputFields,
    });

    const query = new GraphQL.GraphQLObjectType({
      name: 'Query',
      fields: () => {
        return {
          persons: {
            args: inputArgs,
            type: new GraphQL.GraphQLList(Person),
            resolve: () => {
              return [{ id: 1, name: '' }];
            },
          },
        };
      },
    });
    const schema = new GraphQL.GraphQLSchema({
      Person,
      query,
    });

    log.info('schema');

    try {
      const queryResult = await GraphQL.graphql({
        schema,
        source: `
        query {
          # hello
          persons {
            id
            name
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
