const log = require('mk-log');
const NodeEdgeInspector = require('./graph-node/node-edge-inspector.js');
//const NodeTypeBuilder = require('../lib/graphql/builders/node-type-builder.js');
const TypeBuilder = require('../lib/graphql/builders/type-builder.js');
const GraphqlMysqlResolveBuilder = require('../lib/resolvers/graphql-mysql-resolve-builder.js');
const GraphQL = require('graphql');
const CommonGraphqlTypes = require('./graphql/common-types.graphql.js');
const knexfile = require('../knexfile.js');
const Database = require('../lib/db/mysql/database.js');
const MysqlSchemaReader = require('../lib/db/mysql/mysql-schema-reader.js');
const MysqlSchemaJournalAdapters = require('../lib/db/mysql/mysql-schema-journal-adapters');

function buildArgs(typeBuilder, closFn) {
  const domesticInputTypes = typeBuilder.domesticTypes('Input');
  const searchInputType = typeBuilder.searchType('Input');
  const excludeInputType = typeBuilder.excludeType('Input');
  const orderInputType = typeBuilder.orderType('Input');
  const rangeInputType = typeBuilder.rangeType('Input');

  domesticInputTypes.forEach((gqlType, fieldName) => {
    closFn(fieldName, {
      type: gqlType,
    });
  });

  searchInputType.one((gqlType) => {
    closFn('search', {
      type: gqlType,
    });
  });

  excludeInputType.one((gqlType) => {
    closFn('exclude', {
      type: gqlType,
    });
  });

  rangeInputType.one((gqlType) => {
    closFn('range', {
      type: gqlType,
    });
  });

  orderInputType.one((gqlType) => {
    closFn('order', {
      type: gqlType,
    });
  });
}

function ensureNodeType(node, typesClos, outputFieldsClos) {
  const typeBuilder = TypeBuilder(node, typesClos());
  log.info('node', node.capitalizedName());
  if (node.capitalizedName() === 'Commendation') {
    log.info('outputFields', outputFieldsClos());
  }
  const domesticOutputTypes = typeBuilder.domesticTypes('Output');
  domesticOutputTypes.forEach((gqlType, fieldName) => {
    outputFieldsClos()[fieldName] = {
      type: gqlType,
    };
  });
  const capitalizedName = node.capitalizedName();
  let NodeType = typesClos()[capitalizedName];
  if (NodeType) {
    return NodeType;
  }

  NodeType = new GraphQL.GraphQLObjectType({
    name: capitalizedName,
    fields: () => ({
      error: {
        type: CommonGraphqlTypes.ErrorOutput,
      },
      ...outputFieldsClos(),
    }),
  });
  typesClos()[capitalizedName] = NodeType;
  return NodeType;
}

function ensureNodeListType(node, typesClos, outputFieldsClos) {
  const typeBuilder = TypeBuilder(node, typesClos());

  const domesticOutputTypes = typeBuilder.domesticTypes('Output');
  domesticOutputTypes.forEach((gqlType, fieldName) => {
    outputFieldsClos()[fieldName] = {
      type: gqlType,
    };
  });

  //const NodeType = ensureNodeType(node, typesClos, outputFieldsClos);
  const capitalizedListName = `${node.capitalizedName()}List`;
  //log.info('capitalizedListName: ' + capitalizedListName);
  let NodeListType = typesClos()[capitalizedListName];
  if (NodeListType) {
    return NodeListType;
  }
  NodeListType = new GraphQL.GraphQLObjectType({
    name: capitalizedListName,
    fields: () => ({
      docs: {
        type: new GraphQL.GraphQLList(
          ensureNodeType(node, typesClos, outputFieldsClos)
        ),
      },
      error: {
        type: CommonGraphqlTypes.ErrorOutput,
      },
      pagination: {
        type: CommonGraphqlTypes.PaginationOutput,
      },
    }),
  });
  typesClos()[capitalizedListName] = NodeListType;
  return NodeListType;
}

module.exports = async function GraphqlMysqlSchemaBuilder() {
  const database = Database(knexfile);
  const resolveBuilder = await GraphqlMysqlResolveBuilder(database);
  const metaSchemas = await MysqlSchemaReader(database.knex);
  const journal = MysqlSchemaJournalAdapters(metaSchemas);
  async function run() {
    try {
      //const collectedDataTypesCode = new Map().merge(CommonGraphqlTypes);

      // types go top level of the schema

      const queryFields = {};
      const mutationFields = {};
      const types = {}; // root types

      journal.forEach((node) => {
        const outputFields = {};

        const inputArgs = {};
        const typeBuilder = TypeBuilder(node, types);
        buildArgs(typeBuilder, (key, obj) => {
          inputArgs[key] = obj;
        });

        //const NodeType = ensureNodeType(node, () => types);

        queryFields[node.name()] = {
          type: ensureNodeType(
            node,
            () => types,
            () => outputFields
          ),
          args: inputArgs,
          resolve: resolveBuilder.item(null, node),
        };

        //const NodeListType = ensureNodeListType(node, () => types);

        queryFields[node.tableName] = {
          type: ensureNodeListType(
            node,
            () => types,
            () => outputFields
          ),
          args: inputArgs,
          resolve: resolveBuilder.list(null, node),
        };

        const edgeInspector = NodeEdgeInspector(node, journal);
        edgeInspector.addEventListener('parent', (parentNode) => {
          const NodeType = ensureNodeType(
            parentNode,
            () => types,
            () => {}
          );
          outputFields['parent'] = {
            // since parent node referes to tree structure
            // is's of the same type as node
            type: NodeType,
            resolve: resolveBuilder.treeParent(parentNode, node),
          };
        });

        edgeInspector.addEventListener('children', (childNode) => {
          const NodeListType = ensureNodeListType(childNode, () => types);
          outputFields['children'] = {
            // since parent node referes to tree structure
            // is's of the type as node
            type: NodeListType,
            resolve: resolveBuilder.treeChildren(node, childNode),
          };
        });

        edgeInspector.addEventListener('root', (rootNode) => {
          const NodeType = ensureNodeType(rootNode, () => types);
          outputFields['parent'] = {
            // since parent node referes to tree structure
            // is's of the type as node
            type: NodeType,
            resolve: resolveBuilder.treeRoot(rootNode, node),
          };
        });

        edgeInspector.addEventListener('roots', (rootNode) => {
          //const NodeListType = ensureNodeListType(rootNode, () => types);
          outputFields['roots'] = {
            // since parent node referes to tree structure
            // is's of the type as node
            type: NodeListType,
            resolve: resolveBuilder.treeChildren(node, rootNode),
          };
        });

        edgeInspector.addEventListener('belongsTo', (neighbourNode) => {
          //const NodeType = () => ensureNodeType(neighbourNode, () => types);
          outputFields[neighbourNode.name()] = {
            // since parent node referes to tree structure
            // is's of the type as node
            type: ensureNodeType(
              neighbourNode,
              () => types,
              () => ({})
            ),
            resolve: resolveBuilder.item(node, neighbourNode),
          };
        });

        edgeInspector.addEventListener('association', (neighbourNode) => {
          const typeBuilder = TypeBuilder(neighbourNode, types);
          const searchInputType = typeBuilder.searchType('Input');
          const orderInputType = typeBuilder.orderType('Input');
          const args = {};

          searchInputType.one((gqlType) => {
            args['search'] = {
              type: gqlType,
            };
          });

          orderInputType.one((gqlType) => {
            args['order'] = {
              type: gqlType,
            };
          });

          //const NodeListType = () => ensureNodeListType(neighbourNode, () => types);

          outputFields[neighbourNode.tableName] = {
            // since parent node referes to tree structure
            // is's of the type as node
            type: ensureNodeListType(
              neighbourNode,
              () => types,
              () => ({})
            ),
            args,
            resolve: resolveBuilder.item(node, neighbourNode),
          };
        });
        edgeInspector.run();
        /* -------------------------------------------------- */
        /*      build input args before output fields         */

        /* -------------------------------------------------- */

        /* -------------------------------------------------- */

        //const graphqlTypeBuilder = GraphqlTypeBuilder(node);

        // plain object needs to be initialized with
        // new GraphQL.GraphQLObjectType()

        //log.info('outputFields', outputFields);

        /*
        mutationFields[`create${node.capitalizedName()}`] = {
          name: `Create${node.capitalizedName()}Input`,
          args: inputArgs,
          resolve: resolveBuilder.createSingle(null, node),
        };

        mutationFields[`create${node.capitalizedName()}List`] = {
          name: `Create${node.capitalizedName()}List`,
          args: inputArgs,
          resolve: resolveBuilder.createList(null, node),
        };

        mutationFields[`update${node.capitalizedName()}`] = {
          name: `Update${node.capitalizedName()}`,
          args: inputArgs,
          resolve: resolveBuilder.updateSingle(null, node),
        };

        mutationFields[`update${node.capitalizedName()}List`] = {
          name: `Update${node.capitalizedName()}List`,
          args: inputArgs,
          resolve: resolveBuilder.updateList(null, node),
        };
        mutationFields[`delete${node.capitalizedName()}`] = {
          name: `Delete${node.capitalizedName()}`,
          args: inputArgs,
          resolve: resolveBuilder.deleteSingle(null, node),
        };

        mutationFields[`delete${node.capitalizedName()}List`] = {
          name: `Delete${node.capitalizedName()}List`,
          args: inputArgs,
          resolve: resolveBuilder.deleteList(null, node),
        };
        */
      });

      //log.info('queryFields', queryFields);

      const QueryType = new GraphQL.GraphQLObjectType({
        name: 'Query',
        fields: () => queryFields,
      });

      /*
      const MutationType = new GraphQL.GraphQLObjectType({
        name: 'Mutation',
        fields: () => mutationFields,
      });
      */
      const schemaElements = {
        query: QueryType,
        //mutation: MutationType,
      };

      const schema = new GraphQL.GraphQLSchema(schemaElements);

      return schema;
      //log.info('schemaCode:', prettyGraphql(schemaCode));

      //log.info('resolvers', resolvers);
      // log.info('schemaCode', schemaCode);
    } catch (err) {
      log.error(err);
    }
  }

  return {
    run,
  };
};
