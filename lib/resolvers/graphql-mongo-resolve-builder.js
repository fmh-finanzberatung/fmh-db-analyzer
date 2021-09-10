const MongoSchemaAdapters = require('../db/mongo/mongo-schema-journal-adapters.js');
const MongoSchemaReader = require('../db/mongo/mongo-schema-reader.js');
const deconstructResolveArgs = require('./helpers/deconstruct-resolve-args');
const isDateTimeRange = require('./helpers/is-date-time-range.js');
const buildDateString = require('./helpers/build-date-string.js');
const JsDataType = require('../utils/js-data-type.js');
const ConfigReader = require('../utils/config-reader.js');
const MongoRangeComparator = require('../utils/mongo-range-comparator.js');
const buildOrderArgs = require('./helpers/build-order-args.js');
const log = require('mk-log');

function sanitizeStringQuery(s) {
  if (!s) return '';
  return s.replace(/^\*/, '%').replace(/\*$/, '%');
}

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
      const result = MongoRangeComparator(fieldName, rangeObj).greater(
        rangeObj.startType
      );
      fn(result, startDateString);
    }
  }
  if (rangeObj.endVal) {
    const endDateString = buildDateString(rangeObj.endVal);
    if (endDateString) {
      const result = MongoRangeComparator(fieldName, rangeObj).smaller(
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
    const result = MongoRangeComparator(fieldName, rangeObj).greater(
      rangeObj.startType
    );
    fn(result, rangeObj.startVal);
  }

  if (rangeObj.endVal) {
    const result = MongoRangeComparator(fieldName, rangeObj).smaller(
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

module.exports = async function GraphqlMongoResolveBuilder(db) {
  try {
    const configReader = await ConfigReader();

    //await db.collection('companies').deleteMany();
    const metaSchemas = await MongoSchemaReader(db);
    const journal = MongoSchemaAdapters(metaSchemas);

    log.info('metaSchemas', metaSchemas);

    return {
      createSingle(parentNode, node) {
        return async function resolve(...resolveArgs) {
          try {
            const [_parentQueryResult, args, _context] = deconstructResolveArgs(
              ...resolveArgs
            );

            log.info('node.name', node.name);

            const result = await db
              .collections(node.name)
              .insertOne(args.input);

            //const result = await client.forge(args.input).save();

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
        const collection = db.collections(node.name);

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
        return async function resolve(...resolveArgs) {
          try {
            const [_parentQueryResult, args] = deconstructResolveArgs(
              ...resolveArgs
            );
            const result = await db
              .collections(node.name)
              .updateOne({ _id: args.input._id }, args.input);

            return result;
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

        return async function resolve(...resolveArgs) {
          try {
            const [parentQueryResult, args] = deconstructResolveArgs(
              ...resolveArgs
            );
            log.info('configReader', configReader);

            const dbQuery = {};
            buildDependentArgs(
              parentQueryResult,
              parentNode,
              node,
              (whereItem) => {
                log.warn('mongo buildDependentArgs not implemented');
              }
            );
            buildSearchArgs(args, (whereItem) => {
              log.warn('mongo buildSearchArgs not implemented');
            });
            buildOrderArgs(args, (fieldName, orderDirection) => {
              log.warn('mongo buildOrderArgs not implemented');
            });
            buildRangeArgs(args, (whereItem) => {
              log.warn('mongo buildRangeArgs not implemented');
            });

            /*
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
            */
            const result = await db.collections(node.name).find(dbQuery);

            if (!result) {
              return null;
            }

            //ensureResultType(jsonResult, node);

            //log.info(jsonResult);

            return result;
          } catch (err) {
            log.error(err);
          }
        };
      },
      list(parentNode, node) {
        const preferredNode = node || parentNode;
        log.info('preferredNode', preferredNode);
        log.info(
          'config.Reader.node()',
          configReader.node(`${preferredNode.capitalizedName()}List`).denied()
        );

        return async function resolve(...resolveArgs) {
          try {
            if (configReader.node(`${node.capitalizedName()}List`).denied()) {
              return { error: { message: 'Access denied' } };
            }
            const [parentQueryResult, args] = deconstructResolveArgs(
              ...resolveArgs
            );

            const dbQuery = {};
            buildDependentArgs(
              parentQueryResult,
              parentNode,
              node,
              (whereItem) => {
                log.warn('mongo buildDependentArgs not implemented');
              }
            );
            buildSearchArgs(args, (whereItem) => {
              log.warn('mongo buildSearchArgs not implemented');
            });
            buildOrderArgs(args, (fieldName, orderDirection) => {
              log.warn('mongo buildOrderArgs not implemented');
            });
            buildRangeArgs(args, (whereItem) => {
              log.warn('mongo buildRangeArgs not implemented');
            });

            /*
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
                qb.whereRaw(...whereItem);
              });
            }).fetchPage({ page: 1, pageSize: 10 });
            */

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
