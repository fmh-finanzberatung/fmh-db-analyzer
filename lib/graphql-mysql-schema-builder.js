import log from 'mk-log'
import NodeEdgeInspector from './graph-node/node-edge-inspector.js'
import GraphqlTypeBuilder from './graphql/builders/type-builder.js'
import TypesStore from './graphql/types-store.js'
import InputArgsStore from './graphql/input-args-store.js'
import GraphqlMysqlResolveBuilder from './resolvers/graphql-mysql-resolve-builder.js'
import GraphQL from 'graphql'
import CommonGraphqlTypes from './graphql/common-types.graphql.js'
import MysqlSchemaReader from '../lib/db/mysql/mysql-schema-reader.js'
import MysqlSchemaJournalAdapters from './db/mysql/mysql-schema-journal-adapters.js'

export default async function GraphqlMysqlSchemaBuilder(knex, pluginManager) {
  log.info('GraphqlMysqlSchemaBuilder -----------------------------------------------'); 

  const resolveBuilder = await GraphqlMysqlResolveBuilder(knex);
  const metaSchemas = await MysqlSchemaReader(knex);
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
            // since parent node refers to tree structure
            // is's of the type as node
            args,
            typeKey: `${childNode.capitalizedName()}List`,
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

        const typeBuilder = GraphqlTypeBuilder(node);

        const domesticOutputTypes = typeBuilder.domesticTypes('Output');

        const outputFields = {};
        domesticOutputTypes.forEach((gqlType, fieldName) => {
          outputFields[fieldName] = {
            type: gqlType,
          };
        });

        const assocReducer = (acc, assocKey) => {
          const typeKey = associationFields[assocKey].typeKey;

          //log.info('typeKey', typeKey);

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

      if (pluginManager) {
        pluginManager.exec({
          journal,
          metaSchemas,
          knex,
          query: (key, query) => {
            //log.info('----> query', key);
            queryFields[key] = query;
          },
          mutation: (key, mutation) => {
            //log.info('----> mutation', key);
            mutationFields[key] = mutation;
          },
        });
      }
      // log.info('queryFields', queryFields);

      //log.info('queryFields', queryFields);

      const QueryType = new GraphQL.GraphQLObjectType({
        name: 'Query',
        fields: queryFields,
      });

      const MutationType = new GraphQL.GraphQLObjectType({
        name: 'Mutation',
        fields: mutationFields,
      });

      //log.info('mutationFields', mutationFields);
      const schemaElements = {
        query: QueryType,
        mutation: MutationType,
      };

      // log.info('schemaElements', schemaElements);

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
