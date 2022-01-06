const log = require('mk-log');
const NodeEdgeInspector = require('./graph-node/node-edge-inspector.js');
//const NodeTypeBuilder = require('../lib/graphql/builders/node-type-builder.js');
const TypeBuilder = require('../lib/graphql/builders/type-builder.js');
const TypesStore = require('../lib/graphql/types-store.js');
const GraphqlMysqlResolveBuilder = require('../lib/resolvers/graphql-mysql-resolve-builder.js');
const GraphQL = require('graphql');
const CommonGraphqlTypes = require('./graphql/common-types.graphql.js');
const knexfile = require('../knexfile.js');
const Database = require('../lib/db/mysql/database.js');
const MysqlSchemaReader = require('../lib/db/mysql/mysql-schema-reader.js');
const MysqlSchemaJournalAdapters = require('../lib/db/mysql/mysql-schema-journal-adapters');

function buildArgs(node) {
  const typeBuilder = TypeBuilder(node);
  const domesticInputTypes = typeBuilder.domesticTypes('Input');
  const searchInputType = typeBuilder.searchType('Input');
  const excludeInputType = typeBuilder.excludeType('Input');
  const orderInputType = typeBuilder.orderType('Input');
  const rangeInputType = typeBuilder.rangeType('Input');

  const args = {};

  domesticInputTypes.forEach((gqlType, fieldName) => {
    args[fieldName] = {
      type: gqlType,
    };
  });

  searchInputType.one((gqlType) => {
    args['search'] = {
      type: gqlType,
    };
  });

  excludeInputType.one((gqlType) => {
    args['exclude'] = {
      type: gqlType,
    };
  });

  rangeInputType.one((gqlType) => {
    args['range'] = {
      type: gqlType,
    };
  });

  orderInputType.one((gqlType) => {
    args['order'] = {
      type: gqlType,
    };
  });

  return args;
}

module.exports = async function GraphqlMysqlSchemaBuilder() {
  const database = Database(knexfile);
  const resolveBuilder = await GraphqlMysqlResolveBuilder(database);
  const metaSchemas = await MysqlSchemaReader(database.knex);
  const journal = MysqlSchemaJournalAdapters(metaSchemas);
  const typesStore = TypesStore();
  async function run() {
    try {
      // const collectedDataTypesCode = new Map().merge(CommonGraphqlTypes);

      // types go top level of the schema

      const mutationFields = {};
      const types = {}; // root types

      journal.forEach((node) => {
        const associationFields = {};
        //const NodeListType = ensureNodeListType(node, () => types);

        const edgeInspector = NodeEdgeInspector(node, journal);
        edgeInspector.addEventListener('parent', (parentNode) => {
          const args = buildArgs(parentNode);
          associationFields['parent'] = {
            // since parent node referes to tree structure
            // is's of the same type as node
            args: {
              ...args,
            },
            typeKey: node.capitalizedName(),
            resolve: resolveBuilder.treeParent(parentNode, node),
          };
        });

        edgeInspector.addEventListener('children', (childNode) => {
          const args = buildArgs(childNode);
          associationFields['children'] = {
            // since parent node referes to tree structure
            // is's of the type as node
            args,
            typeKey: `${childNode.capitalizedName()}List}`,
            resolve: resolveBuilder.treeChildren(node, childNode),
          };
        });

        edgeInspector.addEventListener('root', (rootNode) => {
          associationFields['parent'] = {
            // since parent node referes to tree structure
            // is's of the type as node
            args: buildArgs(rootNode),
            typeKey: rootNode.capitalizedName(),
            resolve: resolveBuilder.treeRoot(rootNode, node),
          };
        });

        edgeInspector.addEventListener('roots', (rootNode) => {
          const args = buildArgs(rootNode);
          associationFields['roots'] = {
            // since parent node referes to tree structure
            // is's of the type as node
            args: {
              ...args,
            },
            typeKey: `${rootNode.capitalizedName()}List`,
            resolve: resolveBuilder.treeChildren(node, rootNode),
          };
        });

        edgeInspector.addEventListener('belongsTo', (neighbourNode) => {
          const args = buildArgs(neighbourNode);
          associationFields[neighbourNode.name()] = {
            // since parent node referes to tree structure
            // is's of the type as node
            args: {
              ...args,
            },
            typeKey: `${neighbourNode.capitalizedName()}`,
            resolve: resolveBuilder.item(node, neighbourNode),
          };
        });

        edgeInspector.addEventListener('association', (neighbourNode) => {
          const args = buildArgs(neighbourNode);
          associationFields[neighbourNode.tableName] = {
            // since parent node referes to tree structure
            // is's of the type as node
            args: {
              ...args,
            },
            typeKey: `${neighbourNode.capitalizedName()}List`,
            resolve: resolveBuilder.list(node, neighbourNode),
          };
        });
        edgeInspector.run();

        const typeBuilder = TypeBuilder(node);

        const domesticOutputTypes = typeBuilder.domesticTypes('Output');

        const outputFields = {};
        domesticOutputTypes.forEach((gqlType, fieldName) => {
          outputFields[fieldName] = {
            type: gqlType,
          };
        });

        const assocReducer = (acc, assocKey) => {
          const typeKey = associationFields[assocKey].typeKey;
          acc[assocKey] = {
            type: typesStore.fetchType(typeKey),
            resolve: associationFields[assocKey].resolve,
          };
          return acc;
        };

        const nodeTypeDef = {
          name: `${node.capitalizedName()}Output`,
          fields: () => {
            return {
              ...outputFields,
              ...Object.keys(associationFields).reduce(assocReducer, {}),
            };
          },
        };

        typesStore.addTypeDef(node.capitalizedName(), nodeTypeDef);

        const nodeListTypeDef = {
          name: `${node.capitalizedName()}ListOutput`,
          fields: () => ({
            docs: {
              type: new GraphQL.GraphQLList(
                typesStore.fetchType(node.capitalizedName())
              ),
            },
            pagination: {
              type: CommonGraphqlTypes.PaginationOutput,
            },
          }),
        };

        typesStore.addTypeDef(`${node.capitalizedName()}List`, nodeListTypeDef);

        /*
        queryFields[node.name()] = {
          type: typesStore.fetchType(node.capitalizedName()),
          args: inputArgs,
          resolve: resolveBuilder.item(node),
        };
        */
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
      const queryFields = {};

      log.info('typesStore', typesStore);

      journal.forEach((node) => {
        //const nodeType = typesStore.fetchType(node.capitalizedName());
        const args = buildArgs(node);

        queryFields[`${node.name()}`] = {
          type: typesStore.fetchType(node.capitalizedName()),
          args,
          resolve: resolveBuilder.item(null, node),
        };

        queryFields[`${node.tableName}`] = {
          type: typesStore.fetchType(`${node.capitalizedName()}List`),
          args,
          resolve: resolveBuilder.list(null, node),
        };
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
