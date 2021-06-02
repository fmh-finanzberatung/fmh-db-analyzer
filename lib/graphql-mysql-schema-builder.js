const graphqlTools = require('graphql-tools');
const log = require('mk-log');
const NodeEdgeInspector = require('./node-edge-inspector.js');
const Tap = require('./utils/tap');
const GraphqlTypeBuilder = require('../lib/graphql-type-builder.js');
const MysqlSchemaAdapters = require('../lib/db/mysql/mysql-schema-adapters.js');
const MysqlSchemaReader = require('../lib/db/mysql/mysql-schema-reader.js');
const Database = require('../lib/db/mysql/database');
const prettyGraphql = require('../lib/utils/pretty-graphql.js');
const DbToGraphqlTypesMap = require('../lib/utils/db-to-graphql-types-map');
const mysqlTypesMap = DbToGraphqlTypesMap('mysql');
const MysqlResolveBuilder = require('../lib/resolvers/mysql-resolve-builder.js');
const GraphqlInputOrderBuilder = require('./graphql-input-order-builder.js');
const GraphqlInputSearchBuilder = require('./graphql-input-search-builder.js');
const GraphqlInputRangeBuilder = require('./graphql-input-range-builder.js');
const graphqlCommonSDLTypes = require('./graphql-common-sdl-types.js');

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
    addEnumResolver(typeName, resolverObject) {
      if (!pub.resolvers[typeName]) {
        pub.resolvers[typeName] = {};
      }
      pub.resolvers[typeName] = resolverObject;
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
        const collectedDataTypesCode = [graphqlCommonSDLTypes];
        tap
          .fire('collectedDataTypesCode')
          .with('global', collectedDataTypesCode);

        const collectedQueriesCode = [];
        const resolversObjectBuilder = ResolversObjectBuilder();

        journal.forEach((node) => {
          const graphqlTypeBuilder = GraphqlTypeBuilder(node);
          const graphqlInputOrderBuilder = GraphqlInputOrderBuilder(node);
          const graphqlInputSearchBuilder = GraphqlInputSearchBuilder(node);
          const graphqlInputRangeBuilder = GraphqlInputRangeBuilder(node);
          node.domesticAttributes().forEach((attr, fieldName) => {
            const dbDataType = attr.get('DATA_TYPE');
            log.info(dbDataType);
            const graphqlInputType = mysqlTypesMap.gqlInputType(dbDataType);
            graphqlTypeBuilder.addInputFieldDef(fieldName, graphqlInputType);
            const graphqlParamType = mysqlTypesMap.gqlType(dbDataType);
            graphqlTypeBuilder.addParamFieldDef(fieldName, graphqlParamType);
            //const graphqlFieldType = mysqlTypesMap.gqlType(dbDataType);
            //graphqlTypeBuilder.addFieldDef(fieldName, graphqlFieldType);
            graphqlInputOrderBuilder.addFieldName(fieldName);
            //lconst graphqlInputType = mysqlTypesMap.gqlInputType(dbDataType);
            graphqlInputSearchBuilder.addFieldDef(fieldName, graphqlInputType);
            graphqlInputRangeBuilder.addFieldDef(fieldName, graphqlInputType);
          });

          // input types go to schema top level
          collectedDataTypesCode.push(graphqlInputOrderBuilder.result());
          collectedDataTypesCode.push(graphqlInputSearchBuilder.result());
          collectedDataTypesCode.push(graphqlInputRangeBuilder.result());
          // add this to resolver params

          resolversObjectBuilder.addQueryResolver(
            node.name(),
            resolveBuilder.item(null, node)
          );
          resolversObjectBuilder.addQueryResolver(
            node.tableName,
            resolveBuilder.list(null, node)
          );

          const edgeInspector = NodeEdgeInspector(node, journal);
          edgeInspector.addEventListener('parent', (parentNode) => {
            graphqlTypeBuilder.addReturnFieldDef(
              `parent (
                search: ${parentNode.capitalizedName()}Search
              )`,
              node.capitalizedName()
            );

            resolversObjectBuilder.addTypeResolver(
              node.capitalizedName(),
              'parent',
              resolveBuilder.treeParent(parentNode, node)
            );
          });

          edgeInspector.addEventListener('children', (childNode) => {
            graphqlTypeBuilder.addReturnFieldDef(
              `children (
                pagination : PaginationInput
                search: ${childNode.capitalizedName()}Search
                order: ${childNode.capitalizedName()}Order
                range: ${childNode.capitalizedName()}Range
              )`,
              `${node.capitalizedName()}List`
            );

            resolversObjectBuilder.addTypeResolver(
              node.capitalizedName(),
              'children',
              resolveBuilder.treeChildren(node, childNode)
            );
          });

          edgeInspector.addEventListener('root', (parentNode) => {
            graphqlTypeBuilder.addReturnFieldDef(
              `root (
                search: ${node.capitalizedName()}Search
                order: ${node.capitalizedName()}Order
              )`,
              node.capitalizedName()
            );

            resolversObjectBuilder.addTypeResolver(
              node.capitalizedName(),
              'root',
              resolveBuilder.treeRoot(parentNode, node)
            );
          });

          edgeInspector.addEventListener('roots', (childNode) => {
            graphqlTypeBuilder.addReturnFieldDef(
              `roots (
                pagination : PaginationInput
                search: ${node.capitalizedName()}Search
                order: ${node.capitalizedName()}Order
                range: ${node.capitalizedName()}Range
                )`,
              `${node.capitalizedName()}List`
            );

            resolversObjectBuilder.addTypeResolver(
              node.capitalizedName(),
              'roots',
              resolveBuilder.treeRoots(node, childNode)
            );
          });

          edgeInspector.addEventListener('belongsTo', (neighbourNode) => {
            graphqlTypeBuilder.addReturnFieldDef(
              `${neighbourNode.name()} (
                search: ${neighbourNode.capitalizedName()}Search
                order: ${neighbourNode.capitalizedName()}Order
            )`,
              `${neighbourNode.capitalizedName()}`
            );
            resolversObjectBuilder.addTypeResolver(
              node.capitalizedName(),
              neighbourNode.name(),
              resolveBuilder.item(node, neighbourNode)
            );
          });

          edgeInspector.addEventListener('association', (neighbourNode) => {
            graphqlTypeBuilder.addReturnFieldDef(
              `${neighbourNode.tableName} (
                pagination : PaginationInput
                search: ${neighbourNode.capitalizedName()}Search
                order: ${neighbourNode.capitalizedName()}Order
                range: ${neighbourNode.capitalizedName()}Range
              )`,
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
                search: ${node.capitalizedName()}Search
                order: ${node.capitalizedName()}Order
                range: ${node.capitalizedName()}Range
                pagination : PaginationInput
              `;
              },
            })
          );
        });

        const queryTypeCode = `
          # -------------------------------------------- 
          type Query {
            ${collectedQueriesCode.join('\n')} 
          }
        `;
        log.info('queryTypeCode:', prettyGraphql(queryTypeCode));

        const dataTypesCode = collectedDataTypesCode.flat().join('\n');

        log.info(prettyGraphql(dataTypesCode));
        //log.info(queryTypeCode);

        const schemaCode = `
        ${dataTypesCode}
        ${queryTypeCode}
        `;

        //log.info('schemaCode:', prettyGraphql(schemaCode));

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
