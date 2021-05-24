const graphqlTools = require('graphql-tools');
const log = require('mk-log');
const NodeEdgeInspector = require('./node-edge-inspector.js');
const Tap = require('./utils/tap');
const GraphqlTypeBuilder = require('../lib/graphql-type-builder.js');
const MysqlSchemaAdapters = require('../lib/db/mysql/mysql-schema-adapters.js');
const MysqlSchemaReader = require('../lib/db/mysql/mysql-schema-reader.js');
const Database = require('../lib/db/mysql/database');
const DbToGraphqlTypesMap = require('../lib/utils/db-to-graphql-types-map');
const mysqlTypesMap = DbToGraphqlTypesMap('mysql');
const MysqlResolveBuilder = require('../lib/resolvers/mysql-resolve-builder.js');

function ResolversObjectBuilder() {
  const pub = {
    resolvers: {
      Query: {},
    },
    addMutationResolver() {
      log.warning('query not yet implemented');
    },
    addQueryResolver(fieldName, resolverFunction) {
      pub.resolvers.Query[fieldName] = resolverFunction;
    },
    addTypeResolver(typeName, fieldName, resolverFunction) {
      if (!pub.resolvers[typeName]) {
        pub.resolvers[typeName] = {};
      }
      pub.resolvers[typeName][fieldName] = resolverFunction;
    },
  };

  return pub;
}

module.exports = async function GraphqlMysqlSchemaBuilder(knexfile) {
  const resolveBuilder = await MysqlResolveBuilder(knexfile);
  const mysqlDatabase = Database(knexfile);
  const mysqlMetaSchemas = await MysqlSchemaReader(mysqlDatabase.knex);
  const journal = MysqlSchemaAdapters(mysqlMetaSchemas);

  const tap = Tap('collectedDataTypesCode');

  const pub = {
    tap,
    async run() {
      try {
        const collectedDataTypesCode = [
          `
          type Pagination {
            page: Int
            pageSize: Int
            total: Int
            pages: Int
          }
          input PaginationInput {
            page: Int!
            pageSize: Int!
          }
        `,
        ];
        tap
          .fire('collectedDataTypesCode')
          .with('global', collectedDataTypesCode);

        const collectedQueriesCode = ['hello: String'];
        const resolversObjectBuilder = ResolversObjectBuilder();
        resolversObjectBuilder.addQueryResolver('hello', () => 'Hello!');

        journal.forEach((node) => {
          const graphqlTypeBuilder = GraphqlTypeBuilder(node);
          node.domesticAttributes().forEach((attr, fieldName) => {
            const dbDataType = attr.get('DATA_TYPE');
            const graphqlFieldType = mysqlTypesMap.gqlType(dbDataType);
            graphqlTypeBuilder.addFieldDef(fieldName, graphqlFieldType);
          });

          resolversObjectBuilder.addQueryResolver(
            node.name(),
            resolveBuilder.item(node)
          );
          resolversObjectBuilder.addQueryResolver(
            node.tableName,
            resolveBuilder.list(node)
          );
          //collectedQueryiesCode =

          const edgeInspector = NodeEdgeInspector(node, journal);
          edgeInspector.addEventListener('parent', (_parentNode) => {
            graphqlTypeBuilder.addResultFieldDef(
              'parent',
              node.capitalizedName()
            );

            resolversObjectBuilder.addTypeResolver(
              node.capitalizedName(),
              'parent',
              resolveBuilder.item(node)
            );
          });

          edgeInspector.addEventListener('children', () => {
            graphqlTypeBuilder.addResultFieldDef(
              'children',
              `${node.capitalizedName()}List`
            );

            resolversObjectBuilder.addTypeResolver(
              node.capitalizedName(),
              'children',
              resolveBuilder.list(node)
            );
          });

          edgeInspector.addEventListener('belongsTo', (neighbourNode) => {
            graphqlTypeBuilder.addResultFieldDef(
              neighbourNode.name(),
              `${neighbourNode.capitalizedName()}`
            );
            resolversObjectBuilder.addTypeResolver(
              node.capitalizedName(),
              neighbourNode.name(),
              resolveBuilder.item(node)
            );
          });

          edgeInspector.addEventListener('association', (neighbourNode) => {
            const neighbourTypeBuilder = GraphqlTypeBuilder(neighbourNode);

            // TODO add args from neighbourTypeBuilder to
            // addResultTypeDef and then build neighbour fieldType
            // with args

            graphqlTypeBuilder.addResultFieldDef(
              neighbourNode.tableName,
              `${neighbourNode.capitalizedName()}List`
            );

            resolversObjectBuilder.addTypeResolver(
              node.capitalizedName(),
              neighbourNode.tableName,
              resolveBuilder.list(neighbourNode)
            );
          });
          edgeInspector.run();
          const graphqlTypeSingle = graphqlTypeBuilder.singleType();
          const graphqlTypeList = graphqlTypeBuilder.listType(() => {
            return 'pagination : Pagination';
          });

          collectedDataTypesCode.push(graphqlTypeSingle);
          collectedDataTypesCode.push(graphqlTypeList);

          collectedQueriesCode.push(graphqlTypeBuilder.singleQuery());
          collectedQueriesCode.push(
            graphqlTypeBuilder.listQuery(() => {
              return ` 
                pagination : PaginationInput
              `;
            })
          );
        });

        const queryTypeCode = `
          type Query {
            ${collectedQueriesCode.join('\n')} 
          }
        `;

        const dataTypesCode = collectedDataTypesCode.flat().join('\n');

        log.info(dataTypesCode);
        //log.info(queryTypeCode);

        const schemaCode = `
        ${dataTypesCode}
        ${queryTypeCode}
        `;

        //log.info('schemaCode:', schemaCode);

        const resolvers = resolversObjectBuilder.resolvers;

        //log.info('resolvers', resolvers);

        const executableSchema = graphqlTools.makeExecutableSchema({
          typeDefs: schemaCode,
          resolvers,
        });

        pub.schemaCode = schemaCode;
        pub.schema = executableSchema;
      } catch (err) {
        log.error(err);
      }
    },
  };

  return pub;
};
