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
//const prettyGraphql = require('./utils/pretty-graphql.js');
const buildGraphqlTypeFields = require('./build-graphql-type-fields.js');

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

function buildExtraParamsFromMysql(graphqlNode) {
  const graphqlTypeBuilder = GraphqlTypeBuilder(graphqlNode);
  graphqlNode.domesticAttributes().forEach((attr, fieldName) => {
    const dbDataType = attr.get('DATA_TYPE');
    const graphqlFieldType = mysqlTypesMap.gqlType(dbDataType);
    graphqlTypeBuilder.addFieldDef(fieldName, graphqlFieldType);
  });

  const extraParams = buildGraphqlTypeFields(graphqlTypeBuilder.fieldDefs);
  return extraParams;
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
            resolveBuilder.item(null, node)
          );
          resolversObjectBuilder.addQueryResolver(
            node.tableName,
            resolveBuilder.list(null, node)
          );
          //collectedQueryiesCode =

          const edgeInspector = NodeEdgeInspector(node, journal);
          edgeInspector.addEventListener('parent', (parentNode) => {
            const extraParams = buildExtraParamsFromMysql(parentNode);
            graphqlTypeBuilder.addResultFieldDef(
              `parent (${extraParams})`,
              node.capitalizedName()
            );

            resolversObjectBuilder.addTypeResolver(
              node.capitalizedName(),
              'parent',
              resolveBuilder.treeParent(parentNode, node)
            );
          });

          edgeInspector.addEventListener('children', (childNode) => {
            const extraParams = buildExtraParamsFromMysql(childNode);
            graphqlTypeBuilder.addResultFieldDef(
              `children (${extraParams})`,
              `${node.capitalizedName()}List`
            );

            resolversObjectBuilder.addTypeResolver(
              node.capitalizedName(),
              'children',
              resolveBuilder.treeChildren(node, childNode)
            );
          });

          edgeInspector.addEventListener('belongsTo', (neighbourNode) => {
            const extraParams = buildExtraParamsFromMysql(neighbourNode);
            graphqlTypeBuilder.addResultFieldDef(
              `${neighbourNode.name()} (${extraParams})`,
              `${neighbourNode.capitalizedName()}`
            );
            resolversObjectBuilder.addTypeResolver(
              node.capitalizedName(),
              neighbourNode.name(),
              resolveBuilder.item(node, neighbourNode)
            );
          });

          edgeInspector.addEventListener('association', (neighbourNode) => {
            const extraParams = buildExtraParamsFromMysql(neighbourNode);

            graphqlTypeBuilder.addResultFieldDef(
              `${neighbourNode.tableName} (${extraParams})`,
              `
              ${neighbourNode.capitalizedName()}List`
            );

            resolversObjectBuilder.addTypeResolver(
              node.capitalizedName(),
              neighbourNode.tableName,
              resolveBuilder.list(node, neighbourNode)
            );
          });
          edgeInspector.run();
          const graphqlTypeSingle = graphqlTypeBuilder.singleType();
          const graphqlTypeList = graphqlTypeBuilder.listType({
            injectTypes() {
              return 'pagination : Pagination';
            },
          });

          collectedDataTypesCode.push(graphqlTypeSingle);
          collectedDataTypesCode.push(graphqlTypeList);

          collectedQueriesCode.push(graphqlTypeBuilder.singleQuery());
          collectedQueriesCode.push(
            graphqlTypeBuilder.listQuery({
              injectTypes() {
                return ` 
                pagination : PaginationInput
              `;
              },
            })
          );
        });

        const queryTypeCode = `
          type Query {
            ${collectedQueriesCode.join('\n')} 
          }
        `;

        const dataTypesCode = collectedDataTypesCode.flat().join('\n');

        //log.info(prettyGraphql(dataTypesCode));
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
