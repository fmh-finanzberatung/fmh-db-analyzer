import tape from 'tape';
import log from 'mk-log';

import MysqlSchemaAdapters from '../lib/db/mysql/mysql-schema-journal-adapters.js';
import MysqlSchemaReader from '../lib/db/mysql/mysql-schema-reader.js';
import GraphqlTypeBuilder from '../lib/graphql/builders/type-builder.js';

import DbToGraphqlTypesMap from '../lib/utils/db-to-graphql-types-map.js';
import NodeEdgeInspector from '../lib/graph-node/node-edge-inspector.js';
import Knex from 'knex';
import { makeExecutableSchema } from 'graphql-tools';
import { graphql } from 'graphql';
import knexFile from '../knexfile.js';
import GraphqlMysqlResolveBuilder from '../lib/resolvers/graphql-mysql-resolve-builder.js';
import ResolversObjectBuilder from '../lib/utils/resolvers-object-builder.js';

/* needs refactoring, because I removed SDL generation, 
 * doing code first now
 */


const knex = Knex(knexFile);

const mysqlTypesMap = DbToGraphqlTypesMap('mysql');

async function main() {
  tape('simple type', async (t) => {
    try {
      const mysqlResolveBuilder = await GraphqlMysqlResolveBuilder(knex);

      const mysqlMetaSchemas = await MysqlSchemaReader(knex);
      const journal = MysqlSchemaAdapters(mysqlMetaSchemas);

      const collectedQueriesCode = [];
      const collectedMutationsCode = [];

      journal.forEach((node) => {
        const graphqlTypeBuilder = GraphqlTypeBuilder(node);

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
        });

        edgeInspector.addEventListener('root', (parentNode) => {
        });

        edgeInspector.addEventListener('roots', (childNode) => {
        });

        edgeInspector.addEventListener('belongsTo', (neighbourNode) => {
        });

        edgeInspector.addEventListener('association', (neighbourNode) => {

        });

        edgeInspector.run();

      });

      //log.info(prettyGraphql(schemaCode));


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
