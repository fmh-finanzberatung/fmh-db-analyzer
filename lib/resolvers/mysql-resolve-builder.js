const MysqlSchemaAdapters = require('../db/mysql/mysql-schema-adapters.js');
const MysqlModelBuilder = require('../db/mysql/mysql-model-builder.js');
const MysqlSchemaReader = require('../db/mysql/mysql-schema-reader.js');
const Database = require('../db/mysql/database');
const deconstructResolveArgs = require('../utils/deconstruct-resolve-args');
const JsDataType = require('../utils/js-data-type.js');
const MySqlRangeComparator = require('../utils/mysql-range-comparator.js');
const log = require('mk-log');

function sanitizeStringQuery(s) {
  if (!s) return '';
  return s.replace(/^\*/, '%').replace(/\*$/, '%');
}

function isDateTimeRange(rangeObj) {
  if (!rangeObj) return false;
  const res =
    (rangeObj.startVal && rangeObj.startVal.year) ||
    (rangeObj.endVal && rangeObj.endVal.year);
  return res;
}

function ensureTwoDigits(num) {
  let s = `${num}`;
  if (s.length === 1) {
    s += `0${s}`;
  }
  return s;
}

function buildDateString(dateTimeObj) {
  const dateFieldNames = ['year', 'month', 'date'];
  const timeFieldNames = ['hour', 'minute', 'second'];
  const dateFields = dateFieldNames.reduce((dateFields, dateFieldName) => {
    let val = dateTimeObj[dateFieldName];
    if (val) {
      if (dateFieldName.match(/month|date/)) {
        val = ensureTwoDigits(val);
      }
      dateFields.push(val);
    } else {
      dateFields.push('00');
    }
    return dateFields;
  }, []);
  const timeFields = timeFieldNames.reduce((timeFields, timeFieldName) => {
    let val = dateTimeObj[timeFieldName];
    if (val) {
      if (timeFieldName.match(/hour|second/)) {
        val = ensureTwoDigits(val);
      }
      timeFields.push(val);
    } else {
      timeFields.push('00');
    }
    return timeFields;
  }, []);
  return `${dateFields.join('-')} ${timeFields.join(':')}`;
}

function buildDateTimeRangeInterval(fieldName, rangeObj, fn) {
  if (rangeObj.startVal) {
    const startDateString = buildDateString(rangeObj.startVal);
    if (startDateString) {
      const result = MySqlRangeComparator(fieldName, rangeObj).greater(
        rangeObj.startType
      );
      fn(result, startDateString);
    }
  }
  if (rangeObj.endVal) {
    const endDateString = buildDateString(rangeObj.endVal);
    if (endDateString) {
      const result = MySqlRangeComparator(fieldName, rangeObj).smaller(
        rangeObj.endType
      );
      fn(result, endDateString);
    }
  }
}

function buildRangeInterval(fieldName, rangeObj, fn) {
  if (isDateTimeRange(rangeObj)) {
    return buildDateTimeRangeInterval(fieldName, rangeObj, fn);
  }

  if (rangeObj.startVal) {
    const result = MySqlRangeComparator(fieldName, rangeObj).greater(
      rangeObj.startType
    );
    fn(result, rangeObj.startVal);
  }

  if (rangeObj.endVal) {
    const result = MySqlRangeComparator(fieldName, rangeObj).smaller(
      rangeObj.endType
    );
    fn(result, rangeObj.endVal);
  }
}

function buildRangeArgs(args, fn) {
  if (!args.range) return false;
  for (let key in args.range) {
    const fieldName = key;
    const rangeObj = args.range[key];
    buildRangeInterval(fieldName, rangeObj, fn);
  }
}

function buildOrderArgs(args, fn) {
  if (!args.order) return false;
  for (let key in args.order) {
    const fieldName = key;
    const order = args.order[key];
    fn(fieldName, order);
  }
}

function buildSearchArgs(args, fn) {
  if (!args.search) return false;
  const result = [];
  for (let key in args.search) {
    const val = args.search[key];
    let whereItem = '';
    const searchDataType = JsDataType(val);
    if (searchDataType.isString()) {
      const sanitizedVal = sanitizeStringQuery(val);
      whereItem = [`${key} LIKE ?`, [sanitizedVal]];
    } else if (searchDataType.isInteger()) {
      whereItem = [`${key} = ?`, [val]];
    }
    if (whereItem) {
      log.info('whereItem', whereItem);
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
                  qb.whereRaw(...whereItem);
                }
              );
              buildSearchArgs(args, (whereItem) => {
                qb.whereRaw(...whereItem);
              });
              buildOrderArgs(args, (fieldName, orderDirection) => {
                qb.orderBy(fieldName, orderDirection);
              });
              buildRangeArgs(args, (...whereItem) => {
                log.info('whereItem', whereItem);
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
                qb.whereRaw(...whereItem);
              }
            );
            buildSearchArgs(args, (whereItem) => {
              qb.whereRaw(...whereItem);
            });
            buildOrderArgs(args, (fieldName, orderDirection) => {
              qb.orderBy(fieldName, orderDirection);
            });
            buildRangeArgs(args, (whereItem) => {
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
      treeRoot(parentNode, node) {
        const Model = modelBuilder.models.get(node.capitalizedName());

        return async function resolve(...resolveArgs) {
          try {
            const [_parentQueryResult, args] = deconstructResolveArgs(
              ...resolveArgs
            );
            const dbQuery = Model.query((qb) => {
              qb.whereNull(`${node.tableName}.parent_id`);
              buildSearchArgs(args, (whereItem) => {
                qb.whereRaw(...whereItem);
              });
              buildOrderArgs(args, (fieldName, orderDirection) => {
                qb.orderBy(fieldName, orderDirection);
              });
              buildRangeArgs(args, (whereItem) => {
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
      treeRoots(parentNode, node) {
        const Model = modelBuilder.models.get(node.capitalizedName());
        return async function resolve(...resolveArgs) {
          const [_parentQueryResult, args] = deconstructResolveArgs(
            ...resolveArgs
          );
          const result = await Model.query((qb) => {
            qb.whereNull(`${node.tableName}.parent_id`);
            buildSearchArgs(args, (whereItem) => {
              qb.whereRaw(...whereItem);
            });
            buildOrderArgs(args, (fieldName, orderDirection) => {
              qb.orderBy(fieldName, orderDirection);
            });
            buildRangeArgs(args, (whereItem) => {
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
      item(parentNode, node) {
        const Model = modelBuilder.models.get(
          (node || parentNode).capitalizedName()
        );

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
              buildSearchArgs(args, (whereItem) => {
                qb.whereRaw(...whereItem);
              });
              buildOrderArgs(args, (fieldName, orderDirection) => {
                qb.orderBy(fieldName, orderDirection);
              });
              buildRangeArgs(args, (whereItem) => {
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
      list(parentNode, node) {
        const Model = modelBuilder.models.get(
          (node || parentNode).capitalizedName()
        );
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
                  qb.whereRaw(...whereItem);
                }
              );
              buildSearchArgs(args, (whereItem) => {
                qb.whereRaw(...whereItem);
              });
              buildOrderArgs(args, (fieldName, orderDirection) => {
                qb.orderBy(fieldName, orderDirection);
              });
              buildRangeArgs(args, (...whereItem) => {
                log.info('whereItem', whereItem);
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
    log.error(err);
  }
};
