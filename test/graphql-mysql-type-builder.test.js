const tape = require('tape');
const log = require('mk-log');

const MysqlSchemaAdapters = require('../lib/db/mysql/mysql-schema-journal-adapters.js');
const MysqlSchemaReader = require('../lib/db/mysql/mysql-schema-reader.js');
const Database = require('../lib/db/mysql/database');

const DbToGraphqlTypesMap = require('../lib/utils/db-to-graphql-types-map');
const GraphqlTypeBuilder = require('../lib/graphql-type-builder.js');
const NodeEdgeInspector = require('../lib/node-edge-inspector.js');
// const prettyGraphql = require('../lib/utils/pretty-graphql');
const { makeExecutableSchema } = require('graphql-tools');
const { graphql } = require('graphql');
const knexFile = require('../knexfile.js');
const MysqlResolveBuilder = require('../lib/resolvers/graphql-mysql-resolve-builder.js');
const GraphqlInputOrderBuilder = require('../lib/graphql-input-order-builder.js');
const GraphqlInputSearchBuilder = require('../lib/graphql-input-search-builder.js');
const GraphqlInputRangeBuilder = require('../lib/graphql-input-range-builder.js');
const graphqlCommonSDLTypes = require('../lib/graphql-common-sdl-types.js');
const ResolversObjectBuilder = require('../lib/utils/resolvers-object-builder.js');

const mysqlTypesMap = DbToGraphqlTypesMap('mysql');

async function main() {
  await tape('simple type', async (t) => {
    try {
      const resolveBuilder = await MysqlResolveBuilder(knexFile);

      const mysqlDatabase = Database(knexFile);
      const mysqlMetaSchemas = await MysqlSchemaReader(mysqlDatabase.knex);
      const journal = MysqlSchemaAdapters(mysqlMetaSchemas);

      const collectedDataTypesCode = [graphqlCommonSDLTypes];
      const collectedQueriesCode = [];
      const collectedMutationsCode = [];
      const resolversObjectBuilder = ResolversObjectBuilder();

      journal.forEach((node) => {
        const graphqlTypeBuilder = GraphqlTypeBuilder(node);
        const graphqlInputOrderBuilder = GraphqlInputOrderBuilder(node);
        const graphqlInputSearchBuilder = GraphqlInputSearchBuilder(node);
        const graphqlInputRangeBuilder = GraphqlInputRangeBuilder(node);
        node.domesticAttributes().forEach((attr, fieldName) => {
          const dbDataType = attr.get('DATA_TYPE');
          const graphqlInputType = mysqlTypesMap.gqlInputType(dbDataType);

          graphqlTypeBuilder.addInputFieldDef(fieldName, graphqlInputType);
          const graphqlParamType = mysqlTypesMap.gqlType(dbDataType);

          graphqlTypeBuilder.addParamFieldDef(fieldName, graphqlParamType);
          graphqlInputOrderBuilder.addFieldName(fieldName);
          graphqlInputSearchBuilder.addFieldDef(fieldName, graphqlInputType);
          graphqlInputRangeBuilder.addFieldDef(fieldName, graphqlInputType);
        });

        // input types go to schema top level
        collectedDataTypesCode.push(graphqlInputOrderBuilder.result());
        collectedDataTypesCode.push(graphqlInputSearchBuilder.result());
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

        const graphqlTypeSingle = graphqlTypeBuilder.singleType();
        const graphqlTypeList = graphqlTypeBuilder.listType({
          injectTypes() {
            return 'pagination : Pagination';
          },
        });

        collectedDataTypesCode.push(graphqlTypeSingle);
        collectedDataTypesCode.push(graphqlTypeList);

        collectedMutationsCode.push(graphqlTypeBuilder.singleCreateMutation());
        collectedMutationsCode.push(graphqlTypeBuilder.listCreateMutation());
        collectedMutationsCode.push(graphqlTypeBuilder.singleUpdateMutation());
        collectedMutationsCode.push(graphqlTypeBuilder.listUpdateMutation());
        collectedMutationsCode.push(graphqlTypeBuilder.singleDeleteMutation());
        collectedMutationsCode.push(graphqlTypeBuilder.listDeleteMutation());

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
        type Query {
          ${collectedQueriesCode.join('\n')} 
          mutation: Mutation
        }
      `;

      const mutationCode = `
        type Mutation {
          ${collectedMutationsCode.join('\n')} 
        }
      `;

      const dataTypesCode = collectedDataTypesCode.flat().join('\n');

      t.ok(queryTypeCode.match(/type Query/), 'should have type Query');
      t.ok(dataTypesCode.match(/type Person/));
      t.ok(dataTypesCode.match(/type PersonList/));
      t.ok(dataTypesCode.match(/\[Person\]/));

      //log.info('dataTypesCode', dataTypesCode);

      const schemaCode = `
      ${dataTypesCode}
      ${queryTypeCode}
      ${mutationCode}
      `;

      const resolvers = resolversObjectBuilder.resolvers;

      //log.info(prettyGraphql(schemaCode));
      log.info('resolvers', resolvers);

      const schema = makeExecutableSchema({ typeDefs: schemaCode, resolvers });

      const queryResult = await graphql(
        schema,
        `
          query {
            jobs {
              docs {
                id
                title
              }
            }
          }
        `
      );
      log.info('queryResult        ', queryResult.data.jobs.docs);

      const updateResult = await graphql(
        schema,
        `
          mutation {
            updateJobList( updateList: [
              { id: ${queryResult.data.jobs.docs[1].id} title: "New Job 1" }
              { id: ${queryResult.data.jobs.docs[2].id} title: "New Job 2" }
            ]) {
              id
              title
            }
          }
        `
      );

      log.info('updateResult', updateResult);
    } catch (err) {
      log.error(err);
    } finally {
      t.end();
      process.exit(0);
    }
  });
}

main();
