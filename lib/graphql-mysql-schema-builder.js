const log = require('mk-log');
const NodeEdgeInspector = require('./graph-node/node-edge-inspector.js');
const TypeBuilder = require('../lib/graphql/builders/type-builder.js');
const TypesStore = require('../lib/graphql/types-store.js');
const InputArgsStore = require('../lib/graphql/input-args-store.js');
const GraphqlMysqlResolveBuilder = require('../lib/resolvers/graphql-mysql-resolve-builder.js');
const GraphQL = require('graphql');
const CommonGraphqlTypes = require('./graphql/common-types.graphql.js');
const knexfile = require('../knexfile.js');
const Database = require('../lib/db/mysql/database.js');
const MysqlSchemaReader = require('../lib/db/mysql/mysql-schema-reader.js');
const MysqlSchemaJournalAdapters = require('../lib/db/mysql/mysql-schema-journal-adapters');

const DbStringInputType = new GraphQL.GraphQLInputObjectType({
  name: 'DbStringInput',
  fields: {
    name: {
      type: GraphQL.GraphQLString,
    },
    length: {
      type: GraphQL.GraphQLInt,
    },
  },
});

const DbTextInputType = new GraphQL.GraphQLInputObjectType({
  name: 'DbTextInput',
  fields: {
    name: {
      type: GraphQL.GraphQLString,
    },
    length: {
      type: GraphQL.GraphQLInt,
    },
  },
});

const DbIDInputType = new GraphQL.GraphQLInputObjectType({
  name: 'DbIDInput',
  fields: {
    name: {
      type: GraphQL.GraphQLString,
      defaultValue: 'id',
    },
    idType: {
      type: new GraphQL.GraphQLEnumType({
        name: 'DbIDType',
        values: {
          INT: {
            value: 'INT',
          },
          UUID: {
            value: 'UUID',
          },
        },
      }),
      defaultValue: 'INT',
    },
  },
});

const DbIntegerInputType = new GraphQL.GraphQLInputObjectType({
  name: 'DbIntegerInput',
  fields: {
    name: {
      type: GraphQL.GraphQLString,
    },
    isUnsigned: {
      type: GraphQL.GraphQLBoolean,
      defaultValue: true,
    },
  },
});

const DbInputType = new GraphQL.GraphQLInputObjectType({
  name: 'DbInputType',
  fields: {
    string: { type: DbStringInputType },
    text: { type: DbTextInputType },
    integer: { type: DbIntegerInputType },
    id: { type: DbIDInputType },
  },
});

function dbAdmin(
  journal,
  metaSchemas,
  { query, mutation } = { query: () => {}, mutation: () => {} }
) {
  const DbAttributePropertiesType = new GraphQL.GraphQLObjectType({
    name: 'DbAttributeProperties',
    fields: {
      TABLE_CATALOG: { type: GraphQL.GraphQLString },
      TABLE_SCHEMA: { type: GraphQL.GraphQLString },
      TABLE_NAME: { type: GraphQL.GraphQLString },
      COLUMN_DEFAULT: { type: GraphQL.GraphQLString },
      DATA_TYPE: { type: GraphQL.GraphQLBoolean },
      IS_NULLABLE: { type: GraphQL.GraphQLBoolean },
      CHARACTER_MAXIMUM_LENGTH: { type: GraphQL.GraphQLInt },
      CHARACTER_OCTET_LENGTH: { type: GraphQL.GraphQLInt },
      NUMERIC_SCALE: { type: GraphQL.GraphQLInt },
      DATE_TIME_PRECISION: { type: GraphQL.GraphQLInt },
      COLUMN_TYPE: { type: GraphQL.GraphQLString },
      COLUMN_KEY: { type: GraphQL.GraphQLString },
      EXTRA: { type: GraphQL.GraphQLString },
      PRIVILEGES: { type: GraphQL.GraphQLString },
      COLLATION_NAME: { type: GraphQL.GraphQLString },
      COLUMN_COMMENT: { type: GraphQL.GraphQLString },
      IS_GENERATED: { type: GraphQL.GraphQLString },
      GENERATION_EXPRESSION: { type: GraphQL.GraphQLString },
    },
  });

  const AttributeType = new GraphQL.GraphQLObjectType({
    name: 'DbAttributeDef',
    fields: {
      name: { type: GraphQL.GraphQLString },
      properties: {
        type: DbAttributePropertiesType,
      },
      // missing information about
      // primary key, uniqe, index, auto increment, foreign key
    },
  });
  const DbTable = new GraphQL.GraphQLObjectType({
    name: 'DbTable',
    fields: () => ({
      name: {
        type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString),
      },
      attributes: {
        type: new GraphQL.GraphQLList(AttributeType),
      },
    }),
  });

  const createTableMutation = {
    type: DbTable,
    args: {
      name: {
        type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString),
      },
      attributes: {
        type: new GraphQL.GraphQLNonNull(
          new GraphQL.GraphQLList(new GraphQL.GraphQLNonNull(DbInputType))
        ),
      },
    },
    resolve: async (_root, args, _context, _info) => {
      const { name, attributes } = args;
      const db = new Database(knexfile);
      const table = await db.createTable(name, attributes);
      return {
        name: table.name,
        attributes: table.attributes,
      };
    },
  };

  const tablesQuery = {
    type: new GraphQL.GraphQLObjectType({
      name: 'DbSchema',
      fields: () => {
        return {
          name: {
            type: GraphQL.GraphQLString,
          },
          tables: {
            type: new GraphQL.GraphQLList(DbTable),
          },
        };
      },
    }),
    resolve: () => {
      // resolving to

      const tables = Array.from(journal).reduce((list, [_, value]) => {
        //log.info('value', value.attributes);

        const attributes = Array.from(value.attributes).reduce(
          (attrs, [attrKey, attrProperties]) => {
            attrs.push({
              name: attrKey,
              properties: Object.fromEntries(attrProperties),
            });
            return attrs;
          },
          []
        );

        //log.info('attributes', attributes);

        list.push({
          name: value.tableName,
          attributes,
        });
        return list;
      }, []);

      return {
        name: metaSchemas[0][0].TABLE_SCHEMA,
        tables,
      };
    },
  };

  query('dbSchema', tablesQuery);
  mutation('dbCreateTable', createTableMutation);
}

module.exports = async function GraphqlMysqlSchemaBuilder() {
  const database = Database(knexfile);
  const resolveBuilder = await GraphqlMysqlResolveBuilder(database);
  const metaSchemas = await MysqlSchemaReader(database.knex);
  const journal = MysqlSchemaJournalAdapters(metaSchemas);
  const typesStore = TypesStore();
  const inputArgsStore = InputArgsStore();
  async function run() {
    try {
      journal.forEach((node) => {
        const associationFields = {};

        const edgeInspector = NodeEdgeInspector(node, journal);
        edgeInspector.addEventListener('parent', (parentNode) => {
          const args = inputArgsStore.fetchForNode(parentNode);
          associationFields['parent'] = {
            // since parent node referes to tree structure
            // is's of the same type as node
            args,
            typeKey: node.capitalizedName(),
            resolve: resolveBuilder.treeParent(parentNode, node),
          };
        });

        edgeInspector.addEventListener('children', (childNode) => {
          const args = inputArgsStore.fetchForNode(childNode);
          associationFields['children'] = {
            // since parent node referes to tree structure
            // is's of the type as node
            args,
            typeKey: `${childNode.capitalizedName()}List}`,
            resolve: resolveBuilder.treeChildren(node, childNode),
          };
        });

        edgeInspector.addEventListener('root', (rootNode) => {
          const args = inputArgsStore.fetchForNode(rootNode);
          associationFields['parent'] = {
            // since parent node referes to tree structure
            // is's of the type as node
            args,
            typeKey: rootNode.capitalizedName(),
            resolve: resolveBuilder.treeRoot(rootNode, node),
          };
        });

        edgeInspector.addEventListener('roots', (rootNode) => {
          const args = inputArgsStore.fetchForNode(rootNode);
          associationFields['roots'] = {
            // since parent node referes to tree structure
            // is's of the type as node
            args,
            typeKey: `${rootNode.capitalizedName()}List`,
            resolve: resolveBuilder.treeChildren(node, rootNode),
          };
        });

        edgeInspector.addEventListener('belongsTo', (neighbourNode) => {
          const args = inputArgsStore.fetchForNode(neighbourNode);
          associationFields[neighbourNode.name()] = {
            // since parent node referes to tree structure
            // is's of the type as node
            args,
            typeKey: `${neighbourNode.capitalizedName()}`,
            resolve: resolveBuilder.item(node, neighbourNode),
          };
        });

        edgeInspector.addEventListener('association', (neighbourNode) => {
          const args = inputArgsStore.fetchForNode(neighbourNode);
          associationFields[neighbourNode.tableName] = {
            // since parent node referes to tree structure
            // is's of the type as node
            args: {
              ...args,
              pagination: {
                type: CommonGraphqlTypes.PaginationInput,
              },
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
            args: associationFields[assocKey].args,
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
      });

      //log.info('queryFields', queryFields);
      const queryFields = {};
      const mutationFields = {};

      journal.forEach((node) => {
        //const nodeType = typesStore.fetchType(node.capitalizedName());

        const args = inputArgsStore.fetchForNode(node);

        queryFields[`${node.name()}`] = {
          type: typesStore.fetchType(node.capitalizedName()),
          args,
          resolve: resolveBuilder.item(null, node),
        };

        if (!CommonGraphqlTypes.PaginationInput) {
          throw new Error(`PaginationInput is not defined for ${node.name()}`);
        }

        queryFields[`${node.tableName}`] = {
          type: typesStore.fetchType(`${node.capitalizedName()}List`),
          args: {
            ...args,
            pagination: {
              type: CommonGraphqlTypes.PaginationInput,
            },
          },
          resolve: resolveBuilder.list(null, node),
        };

        mutationFields[`create${node.capitalizedName()}`] = {
          type: typesStore.fetchType(node.capitalizedName()),
          args,
          resolve: resolveBuilder.createSingle(null, node),
        };

        mutationFields[`create${node.capitalizedName()}List`] = {
          type: typesStore.fetchType(`${node.capitalizedName()}`),
          args,
          resolve: resolveBuilder.createList(null, node),
        };

        mutationFields[`update${node.capitalizedName()}`] = {
          type: typesStore.fetchType(node.capitalizedName()),
          args,
          resolve: resolveBuilder.updateSingle(null, node),
        };

        mutationFields[`update${node.capitalizedName()}List`] = {
          type: typesStore.fetchType(`${node.capitalizedName()}List`),
          args,
          resolve: resolveBuilder.updateList(null, node),
        };
        mutationFields[`delete${node.capitalizedName()}`] = {
          type: typesStore.fetchType(node.capitalizedName()),
          args,
          resolve: resolveBuilder.deleteSingle(null, node),
        };

        mutationFields[`delete${node.capitalizedName()}List`] = {
          type: typesStore.fetchType(`${node.capitalizedName()}List`),
          args,
          resolve: resolveBuilder.deleteList(null, node),
        };
      });

      dbAdmin(journal, metaSchemas, {
        query: (key, query) => {
          queryFields[key] = query;
        },
        mutation: (key, mutation) => {
          mutationFields[key] = mutation;
        },
      });

      const QueryType = new GraphQL.GraphQLObjectType({
        name: 'Query',
        fields: () => queryFields,
      });

      const MutationType = new GraphQL.GraphQLObjectType({
        name: 'Mutation',
        fields: () => mutationFields,
      });

      const schemaElements = {
        query: QueryType,
        mutation: MutationType,
      };

      const schema = new GraphQL.GraphQLSchema(schemaElements);

      return schema;
    } catch (err) {
      log.error(err);
    }
  }

  return {
    run,
  };
};
