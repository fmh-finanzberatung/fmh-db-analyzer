const MysqlSchemaAdapters = require('../db/mysql/mysql-schema-journal-adapters.js');
const MysqlModelBuilder = require('../db/mysql/mysql-model-builder.js');
const MysqlSchemaReader = require('../db/mysql/mysql-schema-reader.js');
const sanitizeStringQuery = require('../db/mysql/sanitize-string-query.js');
const Database = require('../db/mysql/database');
const deconstructResolveArgs = require('./helpers/deconstruct-resolve-args');
const JsDataType = require('../utils/js-data-type.js');
const ConfigReader = require('../utils/config-reader.js');
const DataLoader = require('dataloader');
const MySqlRangeComparator = require('./helpers/mysql-range-comparator.js');
const isDateTimeRange = require('./helpers/is-date-time-range.js');
const buildDateString = require('./helpers/build-date-string.js');
const buildSearchArgs = require('./helpers/build-search-args.js');
const buildOrderArgs = require('./helpers/build-order-args.js');
const log = require('mk-log');

function ensureStringQuotes(val) {
  const valType = JsDataType(val);
  if (valType.isString()) {
    return `"${val}"`;
  }
  return val;
}

function ensureResultType(jsonResult, node) {
  for (let key in jsonResult) {
    const dataType = node.getAttribute(key).prop('DATA_TYPE');
    if (dataType && dataType.match(/timestamp|datetime/i)) {
      const dateContent = jsonResult[key];
      const date = new Date(dateContent);
      const dateObj = {
        raw: dateContent,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        seconds: date.getSeconds(),
      };
      jsonResult[key] = dateObj;
    } else if (dataType && dataType.match(/tinyint/i)) {
      const intVal = jsonResult[key];
      if (intVal) {
        jsonResult[key] = true;
      } else {
        jsonResult[key] = false;
      }
    }
  }
}

function ensureListResultType(resultList, node) {
  for (let i = 0, l = resultList.length; i < l; i++) {
    ensureResultType(resultList[i], node);
  }
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

// aways invokes callback, because there
// has to be a default pagination
function buildPagination(args) {
  const defaultPagination = { page: 1, pageSize: 10 };
  if (!args.pagination) return defaultPagination;
  return Object.assign({}, defaultPagination, args.pagination);
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

    if (
      parentNode &&
      parentNode.edges &&
      parentNode.edges().includes(node.name())
    ) {
      fn({
        key: `${node.tablename}.id`,
        val: parentQueryResult[`${node.name()}_id`],
      });
      //fn([`${node.tablename}.id = ?`, parentQueryResult[`${node.name()}_id`]]);
    }
    if (parentNode && node.edges && node.edges().includes(parentNode.name())) {
      fn({
        key: `${node.tableName}.${parentNode.name()}_id`,
        val: parentQueryResult.id,
      });
      //fn([
      //  `${node.tableName}.${parentNode.name()}_id = ?`,
      //  [parentQueryResult.id],
      //]);
    }
  } catch (err) {
    log.error(err);
  }
}

module.exports = async function MysqlResolveBuilder(knexConfig) {
  try {
    const configReader = await ConfigReader();
    const database = Database(knexConfig);
    const metaSchemas = await MysqlSchemaReader(database.knex);
    const journal = MysqlSchemaAdapters(metaSchemas);
    const modelBuilder = MysqlModelBuilder(journal, database.Bookshelf);
    modelBuilder.run();

    return {
      createSingle(parentNode, node) {
        const Model = modelBuilder.models.get(node.capitalizedName());

        return async function resolve(...resolveArgs) {
          try {
            const [_parentQueryResult, args, _context] = deconstructResolveArgs(
              ...resolveArgs
            );

            const result = await Model.forge(args.input).save();

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
      createList(parentNode, node) {
        const Model = modelBuilder.models.get(node.capitalizedName());

        return async function resolve(...resolveArgs) {
          try {
            const [_parentQueryResult, args] = deconstructResolveArgs(
              ...resolveArgs
            );

            //const result = await Model.forge(args.input).save();
            const result = await Model.collection(args.inputList).invokeThen(
              'save'
            );

            log.info(result);

            if (!result) {
              return null;
            }
            const jsonResult = result.map((r) => r.toJSON());
            return jsonResult;
          } catch (err) {
            log.error(err);
          }
        };
      },
      updateSingle(parentNode, node) {
        const Model = modelBuilder.models.get(node.capitalizedName());

        return async function resolve(...resolveArgs) {
          try {
            const [_parentQueryResult, args] = deconstructResolveArgs(
              ...resolveArgs
            );
            const model = Model.where('id', args.update.id);
            const updatedRecord = await model.save(args.update, {
              patch: true,
            });

            if (!updatedRecord) {
              return null;
            }
            const jsonResult = updatedRecord.toJSON();
            return jsonResult;
          } catch (err) {
            log.error(err);
          }
        };
      },
      updateList(parentNode, node) {
        return async function resolve(...resolveArgs) {
          try {
            const [_parentQueryResult, args] = deconstructResolveArgs(
              ...resolveArgs
            );
            log.info('args', args.updateList);
            const rows = args.updateList;
            log.info('rows', rows);
            const fieldNames = Object.keys(rows[0]);
            log.info('fieldNames', fieldNames);
            const sqlCode = `INSERT INTO ${node.tableName}
              (${fieldNames.join(', ')}) 
            VALUES
              ${rows
                .map((row) => {
                  return (
                    '(' +
                    fieldNames
                      .map((fieldName) => {
                        return ensureStringQuotes(row[fieldName]);
                      })
                      .join(', ') +
                    ')'
                  );
                })
                .join(',\n')}
            ON DUPLICATE KEY UPDATE
              ${fieldNames
                .filter((f) => f !== 'id')
                .map((f) => f + ' = VALUES (' + f + ')')
                .join(',\n')};
            `;
            const updateResult = await database.knex.raw(sqlCode);
            log.info(sqlCode);
            //const jsonResult = updateResult.toJSON();
            return updateResult;
          } catch (err) {
            log.error(err);
          }
        };
      },
      deleteSingle(_parentNode, _node) {
        log.info('deleteSingle resolver not yet implemented');
        return {};
      },
      deleteList(_parentNode, _node) {
        log.info('deleteList resolver not yet implemented');
        return {};
      },
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
              buildSearchArgs(args, sanitizeStringQuery, ({ key, val }) => {
                qb.whereRaw([`${key} LIKE ?`, [val]]);
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
            buildSearchArgs(args, sanitizeStringQuery, ({ key, val }) => {
              qb.whereRaw([`${key} LIKE ?`, [val]]);
            });
            buildOrderArgs(args, (fieldName, orderDirection) => {
              qb.orderBy(fieldName, orderDirection);
            });
            buildRangeArgs(args, (whereItem) => {
              qb.whereRaw(...whereItem);
            });
          }).fetchPage({ page: 1, pageSize: 10 });

          const docs = result.toJSON();
          ensureListResultType(docs, node);

          const jsonResult = {
            docs,
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
              buildSearchArgs(args, sanitizeStringQuery, ({ key, val }) => {
                qb.whereRaw([`${key} LIKE ?`, [val]]);
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
            buildSearchArgs(args, sanitizeStringQuery, ({ key, val }) => {
              qb.whereRaw([`${key} LIKE ?`, [val]]);
            });
            buildOrderArgs(args, (fieldName, orderDirection) => {
              qb.orderBy(fieldName, orderDirection);
            });
            buildRangeArgs(args, (whereItem) => {
              qb.whereRaw(...whereItem);
            });
          }).fetchPage({ page: 1, pageSize: 10 });

          const docs = result.toJSON();
          ensureListResultType(docs, node);

          const jsonResult = {
            docs,
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
        const preferredNode = node || parentNode;
        log.info(
          'config.Reader.node()',
          configReader.node(preferredNode.capitalizedName()).denied()
        );

        if (configReader.node(node.capitalizedName()).denied()) {
          return { error: { message: 'Access denied' } };
        }

        const Model = modelBuilder.models.get(preferredNode.capitalizedName());

        return async function resolve(...resolveArgs) {
          try {
            const [parentQueryResult, args] = deconstructResolveArgs(
              ...resolveArgs
            );
            log.info('configReader', configReader);

            const dbQuery = Model.query((qb) => {
              buildDependentArgs(
                parentQueryResult,
                parentNode,
                node,
                //(whereItem) => {
                //  qb.whereRaw(...whereItem);
                ({ key, val }) => {
                  qb.whereRaw([`${key} = ?`, val]);
                }
              );
              buildSearchArgs(args, sanitizeStringQuery, ({ key, val }) => {
                qb.whereRaw([`${key} LIKE ?`, [val]]);
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

            ensureResultType(jsonResult, node);

            log.info(jsonResult);

            return jsonResult;
          } catch (err) {
            log.error(err);
          }
        };
      },
      list(parentNode, node) {
        const preferredNode = node || parentNode;
        //const Model = modelBuilder.models.get(preferredNode.capitalizedName());
        log.info(
          'config.Reader.node()',
          configReader.node(`${preferredNode.capitalizedName()}List`).denied()
        );

        //const Model = modelBuilder.models.get(node.capitalizedName());

        return async function resolve(parentQueryResult, args, context, _info) {
          try {
            if (configReader.node(`${node.capitalizedName()}List`).denied()) {
              return { error: { message: 'Access denied' } };
            }

            const contextLoaderKey = [parentNode, node]
              .filter((n) => n)
              .map((n) => n.name())
              .join('_');

            log.info('contextLoaderKey', contextLoaderKey);
            if (!context[contextLoaderKey]) {
              const dataLoader = new DataLoader(async (requestKeys) => {
                log.info('keys', requestKeys);
                const qb = database.knex(node.tableName);
                requestKeys.forEach((key) => {
                  if (key !== 'root') {
                    const depArgs = JSON.parse(key);
                    qb.orWhere(...depArgs);
                  }
                });
                buildSearchArgs(args, sanitizeStringQuery, ({ key, val }) => {
                  qb.whereRaw([`${key} LIKE ?`, [val]]);
                });
                buildOrderArgs(args, (fieldName, orderDirection) => {
                  qb.orderBy(fieldName, orderDirection);
                });
                buildRangeArgs(args, (...whereItem) => {
                  qb.whereRaw(...whereItem);
                });
                if (requestKeys.find((k) => k === 'root')) {
                  return Promise.all([qb]);
                } else {
                  const totalResults = await qb;


                  const filteredResults = requestKeys.map((key) => {
                    const parsedKey = JSON.parse(key);

                    const tableFieldName = parsedKey[0];
                    const tableFieldVal = parsedKey[2];
                    const fieldName = tableFieldName.split('.')[1];
                    return totalResults.filter((resultItem) => {

                      return resultItem[fieldName] === tableFieldVal;
                    });
                  });

                  //log.info('filteredResults', filteredResults);

                  return Promise.resolve(filteredResults); //Promise.all();
                }
              });
              context[contextLoaderKey] = dataLoader;
            }

            const dataLoader = context[contextLoaderKey];

            let requestKey = 'root';

            buildDependentArgs(
              parentQueryResult,
              parentNode,
              node,
              ({ key, val }) => {
                requestKey = JSON.stringify([key, val]);
              }
            );

            let loaderResult = await dataLoader.load(requestKey);

            //log.info('loaderResult', loaderResult);

            return {
              docs: loaderResult,
              pagination: {
                page: 0,
                pageSize: 0,
                pages: 0,
                total: 0,
              },
            };
            /*
            const result = await Model.query((qb) => {
              buildDependentArgs(
                parentQueryResult,
                parentNode,
                node,
                ({ key, val }) => {
                  qb.where(key, val);
                }
              );
              buildSearchArgs(args, sanitizeStringQuery, ({ key, val }) => {
                qb.whereRaw([`${key} LIKE ?`, [val]]);
              });
              buildOrderArgs(args, (fieldName, orderDirection) => {
                qb.orderBy(fieldName, orderDirection);
              });
              buildRangeArgs(args, (...whereItem) => {
                qb.whereRaw(...whereItem);
              });
            }).fetchPage(buildPagination(args));

            const docs = result.toJSON();

            // add batchSize to inform child nodes about
            // the number of returned docs
            docs.map((doc) => (doc.batchSize = docs.length));

            ensureListResultType(docs, node);

            const jsonResult = {
              docs,
              pagination: {
                page: result.pagination.page,
                pageSize: result.pagination.pageSize,
                total: result.pagination.rowCount,
                pages: result.pagination.pageCount,
              },
            };

            return jsonResult;
            */
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
