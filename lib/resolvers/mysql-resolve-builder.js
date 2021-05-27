const MysqlSchemaAdapters = require('../db/mysql/mysql-schema-adapters.js');
const MysqlModelBuilder = require('../db/mysql/mysql-model-builder.js');
const MysqlSchemaReader = require('../db/mysql/mysql-schema-reader.js');
const Database = require('../db/mysql/database');
const deconstructResolveArgs = require('../utils/deconstruct-resolve-args');
const log = require('mk-log');

function buildWhereArgs(args, fn) {
  const result = [];
  for (let key in args) {
    const val = args[key];
    let whereItem = '';
    if (typeof val === 'string') {
      whereItem = [`${key} LIKE ?`, [`%${val}%`]];
    } else if (typeof val === 'number' && Number.isInteger(val)) {
      whereItem = [`${key} = ?`, [val]];
    }
    if (whereItem) {
      fn(whereItem);
      result.push(whereItem);
    }
  }
  return result;
}

function buildTreeParentArgs(parentQueryResult, parentNode, node, fn) {
  try {
    const parentVal = parentQueryResult['parent_id'];
    fn([`${node.tableName}.id = ?`, [parentVal]]);
  } catch (err) {
    log.error(err);
  }
}

function buildTreeChildrenArgs(parentQueryResult, parentNode, node, fn) {
  try {
    if (parentNode.name() !== node.name()) return false;
    const parentId = parentQueryResult.id;
    fn([`${node.tableName}.parent_id = ?`, [parentId]]);
  } catch (err) {
    log.error(err);
  }
}

function buildDependentArgs(parentQueryResult, parentNode, node, fn) {
  try {
    if (!parentNode) {
      return false;
    }

    if (parentNode && parentNode.edges().includes(node.name())) {
      fn([`${node.tableName}.id = ?`, parentQueryResult[`${node.name()}_id`]]);
    }
    if (parentNode && node.edges().includes(parentNode.name())) {
      fn([
        `${node.tableName}.${parentNode.name()}_id = ?`,
        [parentQueryResult.id],
      ]);
    }
  } catch (err) {
    log.error(err);
  }
}

module.exports = async function MysqlResolveBuilder(knexConfig) {
  try {
    const database = Database(knexConfig);
    const metaSchemas = await MysqlSchemaReader(database.knex);
    const journal = MysqlSchemaAdapters(metaSchemas);
    //log.info('journal', journal);
    const modelBuilder = MysqlModelBuilder(journal, database.Bookshelf);
    modelBuilder.run();

    return {
      treeParent(parentNode, node) {
        const Model = modelBuilder.models.get(node.capitalizedName());

        return async function resolve(...resolveArgs) {
          try {
            const [parentQueryResult, args] = deconstructResolveArgs(
              ...resolveArgs
            );
            const dbQuery = Model.query((qb) => {
              buildTreeParentArgs(
                parentQueryResult,
                parentNode,
                node,
                (whereItem) => {
                  log.info('...dependentItem', whereItem);
                  qb.whereRaw(...whereItem);
                }
              );
              buildWhereArgs(args, (whereItem) => {
                qb.whereRaw(...whereItem);
              });
            });

            // set require: false in order to return null
            // instead of NotFoundError
            const result = await dbQuery.fetch({
              require: false,
              debug: false,
            });
            if (!result) {
              return null;
            }
            const jsonResult = result.toJSON();
            return jsonResult;
          } catch (err) {
            log.error(err);
          }
        };
      },
      item(parentNode, node) {
        const Model = modelBuilder.models.get(node.capitalizedName());

        return async function resolve(...resolveArgs) {
          try {
            const [parentQueryResult, args] = deconstructResolveArgs(
              ...resolveArgs
            );
            const dbQuery = Model.query((qb) => {
              buildDependentArgs(
                parentQueryResult,
                parentNode,
                node,
                (whereItem) => {
                  qb.whereRaw(...whereItem);
                }
              );
              buildWhereArgs(args, (whereItem) => {
                log.info('...whereItem', whereItem);
                qb.whereRaw(...whereItem);
              });
            });

            // set require: false in order to return null
            // instead of NotFoundError
            const result = await dbQuery.fetch({
              require: false,
              debug: false,
            });
            if (!result) {
              return null;
            }
            const jsonResult = result.toJSON();
            return jsonResult;
          } catch (err) {
            log.error(err);
          }
        };
      },
      treeChildren(parentNode, node) {
        const Model = modelBuilder.models.get(node.capitalizedName());
        return async function resolve(...resolveArgs) {
          const [parentQueryResult, args] = deconstructResolveArgs(
            ...resolveArgs
          );
          const result = await Model.query((qb) => {
            buildTreeChildrenArgs(
              parentQueryResult,
              parentNode,
              node,
              (whereItem) => {
                log.info('dependentList', whereItem);
                qb.whereRaw(...whereItem);
              }
            );
            buildWhereArgs(args, (whereItem) => {
              qb.whereRaw(...whereItem);
            });
          }).fetchPage({ page: 1, pageSize: 10 });
          const jsonResult = {
            docs: result.toJSON(),
            pagination: {
              page: result.pagination.page,
              pageSize: result.pagination.pageSize,
              total: result.pagination.rowCount,
              pages: result.pagination.pageCount,
            },
          };
          return jsonResult;
        };
      },
      list(parentNode, node) {
        const Model = modelBuilder.models.get(node.capitalizedName());
        return async function resolve(...resolveArgs) {
          try {
            const [parentQueryResult, args] = deconstructResolveArgs(
              ...resolveArgs
            );
            const result = await Model.query((qb) => {
              buildDependentArgs(
                parentQueryResult,
                parentNode,
                node,
                (whereItem) => {
                  log.info('dependentList', whereItem);
                  qb.whereRaw(...whereItem);
                }
              );
              buildWhereArgs(args, (whereItem) => {
                qb.whereRaw(...whereItem);
              });
            }).fetchPage({ page: 1, pageSize: 10 });
            const jsonResult = {
              docs: result.toJSON(),
              pagination: {
                page: result.pagination.page,
                pageSize: result.pagination.pageSize,
                total: result.pagination.rowCount,
                pages: result.pagination.pageCount,
              },
            };
            return jsonResult;
          } catch (err) {
            log.error(err);
          }
        };
      },
    };
  } catch (err) {
    log.info(err);
  }
};
