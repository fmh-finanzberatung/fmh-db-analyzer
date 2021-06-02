const tape = require('tape');
const log = require('mk-log');
//const GraphNode = require('../lib/graph-node.js');

const MysqlSchemaAdapters = require('../lib/db/mysql/mysql-schema-adapters.js');
//const MysqlModelBuilder = require('../lib/db/mysql/mysql-model-builder.js');
const MysqlSchemaReader = require('../lib/db/mysql/mysql-schema-reader.js');
const Database = require('../lib/db/mysql/database');

const DbToGraphqlTypesMap = require('../lib/utils/db-to-graphql-types-map');
const GraphqlTypeBuilder = require('../lib/graphql-type-builder.js');
const NodeEdgeInspector = require('../lib/node-edge-inspector.js');
const prettyGraphql = require('../lib/utils/pretty-graphql');
const { makeExecutableSchema } = require('graphql-tools');
const { graphql, buildSchema } = require('graphql');
const knexFile = require('../knexfile.js');
const MysqlResolveBuilder = require('../lib/resolvers/mysql-resolve-builder.js');
//const knexConfig = require('knex')(knexFile);

const mysqlTypesMap = DbToGraphqlTypesMap('mysql');

async function main() {
  await tape('simple type', async (t) => {
    try {
      const resolveBuilder = await MysqlResolveBuilder(knexFile);

      const mysqlDatabase = Database(knexFile);
      const mysqlMetaSchemas = await MysqlSchemaReader(mysqlDatabase.knex);
      const journal = MysqlSchemaAdapters(mysqlMetaSchemas);
      //log.info('journal', journal);

      const collectedDataTypesCode = [];
      const collectedQueriesCode = [];
      const resolvers = {
        // also define Mutation here
      };

      log.info('journal', journal);

      journal.forEach((node) => {
        log.info('1 node', node.tableName);

        const graphqlType = GraphqlTypeBuilder(node);
        node.domesticAttributes().forEach((attr, fieldName) => {
          const dbDataType = attr.get('DATA_TYPE');
          const graphqlFieldType = mysqlTypesMap.gqlType(dbDataType);
          graphqlType.addFieldDef(fieldName, graphqlFieldType);
        });

        log.info('2 node', node.tableName);

        resolvers[node.name()] = resolveBuilder.item(node);

        log.info('node************', node.tableName);

        resolvers[node.tableName] = resolveBuilder.list(node);

        //collectedQueryiesCode =

        const edgeInspector = NodeEdgeInspector(node, journal);
        edgeInspector.addEventListener('parent', () => {
          //log.info('<==== parent');
        });
        edgeInspector.addEventListener('children', () => {
          //log.info('====> children');
        });
        edgeInspector.addEventListener('association', () => {
          //log.info('====> association');
        });
        edgeInspector.run();
        const graphqlTypeSingle = graphqlType.singleType(node);
        const graphqlTypeList = graphqlType.listType(node);

        collectedDataTypesCode.push(graphqlTypeSingle);
        collectedDataTypesCode.push(graphqlTypeList);

        collectedQueriesCode.push(graphqlType.singleQuery(node));
        collectedQueriesCode.push(graphqlType.listQuery(node));
      });

      const queryTypeCode = `
        type Query {
          ${collectedQueriesCode.join('\n')} 
        }
      `;

      const dataTypesCode = collectedDataTypesCode.flat().join('\n');
      //log.info('collectedQueriesCode', collectedQueriesCode);

      //log.info('queryTypeCode ------------------', queryTypeCode);
      //log.info(
      //  'collectedDataTypesCode ------------------',
      //  collectedDataTypesCode
      //);

      //log.info('******** collectedDataTypesCode', collectedDataTypesCode);
      t.ok(queryTypeCode.match(/type Query/), 'should have type Query');
      t.ok(dataTypesCode.match(/type Person/));
      t.ok(dataTypesCode.match(/type PersonList/));
      t.ok(dataTypesCode.match(/\[Person\]/));

      const schemaCode = `
      ${dataTypesCode}
      ${queryTypeCode}
      `;

      log.info(prettyGraphql(schemaCode));

      //log.info('dataTypesCode ------------------', dataTypesCode);

      log.info('resolvers', resolvers);

      const schema = makeExecutableSchema({ typeDefs: schemaCode, resolvers });

      const queryResult = await graphql(
        schema,
        `
          query {
            jobs(search: { title: "Exterior" }) {
              docs {
                title
              }
            }
          }
        `
      );

      log.info('queryResult', queryResult);
    } catch (err) {
      log.error(err);
    } finally {
      t.end();
      process.exit(0);
    }
  });
}

main();
