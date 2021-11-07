const tape = require('tape');
const knexFile = require('../knexfile.js');
const knex = require('knex')(knexFile);
const log = require('mk-log');
const GraphqlMysqlResolveBuilder = require('../lib/resolvers/graphql-mysql-resolve-builder.js');
const MysqlSchemaAdapters = require('../lib/db/mysql/mysql-schema-journal-adapters.js');
const MysqlSchemaReader = require('../lib/db/mysql/mysql-schema-reader.js');
const GraphqlSchemaBuilder = require('../lib/graphql-schema-builder.js');
const DbToGraphqlTypesMap = require('../lib/utils/db-to-graphql-types-map');
const typesMap = DbToGraphqlTypesMap('mysql');
const { graphql } = require('graphql');

async function main() {
  await tape(async (t) => {
    try {
      const resolveBuilder = await GraphqlMysqlResolveBuilder(knexFile);
      const mysqlMetaSchemas = await MysqlSchemaReader(knex);
      const journal = MysqlSchemaAdapters(mysqlMetaSchemas);
      const schemaBuilder = await GraphqlSchemaBuilder({
        resolveBuilder,
        journal,
        typesMap,
      });
      schemaBuilder.run();
      const graphqlSchema = schemaBuilder.schema;

      log.warn('This test needs an implementation');

      //t.plan(1);
      //const metaSchemas = await MysqlSchemaReader(knex);
      //const journal = MysqlSchemaAdapters(metaSchemas);
      //journal.forEach((node) => {
      //    const graphqlTypeBuilder = GraphqlTypeBuilder(node);
      const queryA = `
        {
          persons (pagination: {page: 1 pageSize: 2}) {
              docs {
                id
                company {
                  persons {
                    docs {
                      id
                    }
                  }
                }
              }
          }
        }
      `;
      const queryB = `
        {
          persons  {
            pagination {
              total,
              pages,
              isFirst,
              isLast,
              next,
              prev
            
            docs {
              id
              company {
                legal_name 
                persons {
                  pagination {
                    total
                  } 
                  docs {
                    family_name
                    id
                  }
                }
              }
            }
          }
        }`;
      const queryC = `
        {
          persons (pagination: { pageSize: 2 } search: {family_name: "Galt"})  {
            docs {
              id
              family_name
              company {
                legal_name 
                persons (order: {family_name: DESC}) {
                  docs {
                    family_name
                    id
                    job {
                      id 
                      title
                    } 
                  }
                }
              }
            }
          }
        }`;
      //let res =
      const queryD = `
        {
          awards(search: {name: "fmh-award"}) {
            docs {
              name
              description
              commendations ( pagination: { pageSize:5 } order: {id: DESC} ) {
                docs {
                  id
                  perma_name
                  image_file_name
                  volume {
                    year 
                    commendations {
                      docs {
                        id
                        laureates {
                          docs {
                            id
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }  `;
      const result = await graphql(graphqlSchema, queryD, null, {
        text: 'I am context',
      });
      log.info('result', result);
      //log.info('result', JSON.stringify(result, null, 2));
    } catch (err) {
      log.error(err);
    } finally {
      t.end();
      process.exit(0);
    }
  });
}

main();
