const graphqlTools = require('graphql-tools');
const log = require('mk-log');
const NodeEdgeInspector = require('./node-edge-inspector.js');
const Tap = require('./utils/tap');
const GraphqlTypeBuilder = require('../lib/graphql-type-builder.js');
const GraphqlInputOrderBuilder = require('./graphql-input-order-builder.js');
const GraphqlInputSearchBuilder = require('./graphql-input-search-builder.js');
const GraphqlInputExcludeBuilder = require('./graphql-input-exclude-builder.js');
const GraphqlInputRangeBuilder = require('./graphql-input-range-builder.js');
const GraphQLCommonTypes = require('./graphql/common-types.graphql.js');
const ResolversObjectBuilder = require('../lib/utils/resolvers-object-builder.js');

module.exports = async function GraphqlSchemaBuilder({
  resolveBuilder,
  journal,
  typesMap,
}) {
  const tap = Tap('collectedDataTypesCode');

  const pub = {
    tap,
    async run() {
      try {
        const collectedDataTypesCode = [GraphQLCommonTypes];
        tap
          .fire('collectedDataTypesCode')
          .with('global', collectedDataTypesCode);

        const collectedQueriesCode = [];
        const collectedMutationsCode = [];
        const resolversObjectBuilder = ResolversObjectBuilder();

        journal.forEach((node) => {
          const graphqlTypeBuilder = GraphqlTypeBuilder(node);
          const graphqlInputOrderBuilder = GraphqlInputOrderBuilder(node);
          const graphqlInputSearchBuilder = GraphqlInputSearchBuilder(node);
          const graphqlInputExcludeBuilder = GraphqlInputExcludeBuilder(node);
          const graphqlInputRangeBuilder = GraphqlInputRangeBuilder(node);
          node.domesticAttributes().forEach((attr, fieldName) => {
            const dbDataType = attr.get('DATA_TYPE');
            log.info(dbDataType);
            const graphqlInputType = typesMap.gqlInputType(dbDataType);
            graphqlTypeBuilder.addInputFieldDef(fieldName, graphqlInputType);
            const graphqlParamType = typesMap.gqlType(dbDataType);
            graphqlTypeBuilder.addParamFieldDef(fieldName, graphqlParamType);
            graphqlInputOrderBuilder.addFieldName(fieldName);
            graphqlInputSearchBuilder.addFieldDef(fieldName, graphqlInputType);
            graphqlInputExcludeBuilder.addFieldDef(fieldName, graphqlInputType);
            graphqlInputRangeBuilder.addFieldDef(fieldName, graphqlInputType);
          });

          // input types go to schema top level
          collectedDataTypesCode.push(graphqlInputOrderBuilder.result());
          collectedDataTypesCode.push(graphqlInputSearchBuilder.result());
          collectedDataTypesCode.push(graphqlInputExcludeBuilder.result());
          collectedDataTypesCode.push(graphqlInputRangeBuilder.result());
          // add this to resolver params

          resolversObjectBuilder.addMutationResolver(
            `create${node.capitalizedName()}`,
            resolveBuilder.createSingle(null, node)
          );

          resolversObjectBuilder.addMutationResolver(
            `create${node.capitalizedName()}List`,
            resolveBuilder.createList(null, node)
          );

          resolversObjectBuilder.addMutationResolver(
            `update${node.capitalizedName()}`,
            resolveBuilder.updateSingle(null, node)
          );

          resolversObjectBuilder.addMutationResolver(
            `update${node.capitalizedName()}List`,
            resolveBuilder.updateList(null, node)
          );

          resolversObjectBuilder.addMutationResolver(
            `delete${node.capitalizedName()}`,
            resolveBuilder.deleteSingle(null, node)
          );

          resolversObjectBuilder.addMutationResolver(
            `delete${node.capitalizedName()}List`,
            resolveBuilder.deleteList(null, node)
          );

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

          const graphqlCreateInputSingle = graphqlTypeBuilder.createInput();
          collectedDataTypesCode.push(graphqlCreateInputSingle);
          const graphqlUpdateInputSingle = graphqlTypeBuilder.updateInput();
          collectedDataTypesCode.push(graphqlUpdateInputSingle);

          const graphqlTypeSingle = graphqlTypeBuilder.singleType({
            injectTypes() {
              return `error: Error`;
            },
          });
          log.debug(graphqlTypeSingle);
          const graphqlTypeList = graphqlTypeBuilder.listType({
            injectTypes() {
              return `pagination : Pagination
                error: Error
              `;
            },
          });

          collectedDataTypesCode.push(graphqlTypeSingle);
          collectedDataTypesCode.push(graphqlTypeList);

          collectedMutationsCode.push(
            graphqlTypeBuilder.singleCreateMutation()
          );
          collectedMutationsCode.push(graphqlTypeBuilder.listCreateMutation());
          collectedMutationsCode.push(
            graphqlTypeBuilder.singleUpdateMutation()
          );
          collectedMutationsCode.push(graphqlTypeBuilder.listUpdateMutation());
          collectedMutationsCode.push(
            graphqlTypeBuilder.singleDeleteMutation()
          );
          collectedMutationsCode.push(graphqlTypeBuilder.listDeleteMutation());

          collectedQueriesCode.push(
            graphqlTypeBuilder.singleQuery({
              injectTypes() {
                return ` 
              search: ${node.capitalizedName()}Search
              exclude: ${node.capitalizedName()}Exclude
              order: ${node.capitalizedName()}Order
              range: ${node.capitalizedName()}Range
            `;
              },
            })
          );
          collectedQueriesCode.push(
            graphqlTypeBuilder.listQuery({
              injectTypes() {
                return ` 
                search: ${node.capitalizedName()}Search
                exclude: ${node.capitalizedName()}Exclude
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
        //log.info('queryTypeCode:', prettyGraphql(queryTypeCode));

        const mutationCode = `
          type Mutation {
            ${collectedMutationsCode.join('\n')} 
          }
        `;

        const dataTypesCode = collectedDataTypesCode.flat().join('\n');

        //log.info(prettyGraphql(dataTypesCode));
        //log.info(queryTypeCode);

        const schemaCode = `
        ${dataTypesCode}
        ${queryTypeCode}
        ${mutationCode}
        `;

        //log.info('schemaCode:', prettyGraphql(schemaCode));

        const resolvers = resolversObjectBuilder.resolvers;

        //log.info('resolvers', resolvers);
        // log.info('schemaCode', schemaCode);

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
