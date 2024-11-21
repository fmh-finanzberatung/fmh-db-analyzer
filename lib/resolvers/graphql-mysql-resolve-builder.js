import log from 'mk-log';
import MysqlSchemaJournalAdapters from '../db/mysql/mysql-schema-journal-adapters.js';
import MysqlModelBuilder from '../db/mysql/mysql-model-builder.js';
import MysqlSchemaReader from '../db/mysql/mysql-schema-reader.js';
import sanitizeStringQuery from '../db/mysql/sanitize-string-query.js';
import deconstructResolveArgs from './helpers/deconstruct-resolve-args.js';
import JsDataType from '../utils/js-data-type.js';
import ConfigReader from '../utils/config-reader.js';
import DataLoader from 'dataloader';
import MySqlRangeComparator from './helpers/mysql-range-comparator.js';
import isDateTimeRange from './helpers/is-date-time-range.js';
import buildDateString from './helpers/build-date-string.js';
import buildFilterArgs from './helpers/build-filter-args.js';
import buildOrderArgs from './helpers/build-order-args.js';

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
        iso: date.toISOString(),
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
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

// always invokes callback, because there
// has to be a default pagination
function buildPagination(args, fn) {
  const defaultPagination = { page: 1, pageSize: 10 };
  if (!args.pagination) {
    if (fn) fn(defaultPagination);
    return defaultPagination;
  }
  const mergedPagination = Object.assign(
    {},
    defaultPagination,
    args.pagination
  );
  if (fn) fn(mergedPagination);

  return mergedPagination;
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
    if (!parentNode || !parentQueryResult) {
      return false;
    }

    let valFieldName = `${node.name()}_id`;
    let val = parentQueryResult[valFieldName];
    let key = `${node.tableName}.id`;

    if (val) {
      return fn({
        key,
        val,
      });
    }

    // since it is known that a relationship between
    // node and parentNode exists but parentQueryResult
    // does not contain a reference to node,
    // the reference must be in node
    valFieldName = `id`;
    val = parentQueryResult[valFieldName];
    key = `${node.tableName}.${parentNode.name()}_id`;

    if (val) {
      return fn({
        key,
        val,
      });
    }
  } catch (err) {
    log.error(err);
  }
}

function commonDbQueries({ qb, args }) {
  if (!args) return false;
  for (let key in args) {
    if (!key.match(/search|exclude|order|range|pagination/)) {
      const val = args[key];
      if (val) {
        qb.where(key, val);
      }
    }
  }

  const filterArgs = buildFilterArgs(args, sanitizeStringQuery);
  filterArgs.search({
    txt({ key, val }) {
      qb.whereRaw(`${key} LIKE ?`, val);
    },
    num({ key, val }) {
      qb.where(key, val);
    },
    bool({ key, val }) {
      qb.where(key, val);
    },
  });
  filterArgs.exclude({
    txt({ key, val }) {
      qb.whereRaw(`${key} NOT LIKE ?`, val);
    },
    num({ key, val }) {
      qb.whereNot(key, val);
    },
    bool({ key, val }) {
      qb.whereNot(key, val);
    },
  });
  buildOrderArgs(args, (fieldName, orderDirection) => {
    qb.orderBy(fieldName, orderDirection);
  });
  buildRangeArgs(args, (...whereItem) => {
    qb.whereRaw(...whereItem);
  });
  //log.debug('args', args);
}

function buildResultPagination(total, { page, pageSize }) {
  const pages =
    total % pageSize ? Math.floor(total / pageSize) + 1 : total / pageSize;
  const isLast = pages === page;
  const isFirst = page === 1;

  return {
    page,
    pageSize,
    total,
    pages,
    isLast,
    isFirst,
    first: 1,
    last: pages,
    next: isLast ? pages : page + 1,
    prev: isFirst ? 1 : page - 1,
  };
}

export default async function GraphqlMysqlResolveBuilder(knex) {
  try {
    const configReader = await ConfigReader();
    //const database = Database(knexConfig);
    const metaSchemas = await MysqlSchemaReader(knex);

    // log.info('MysqlSchemaJournalAdapters', MysqlSchemaJournalAdapters);
    const journal = MysqlSchemaJournalAdapters(metaSchemas);
    const modelBuilder = MysqlModelBuilder(journal, knex);
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
            const rows = args.updateList;
            const fieldNames = Object.keys(rows[0]);
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
            const updateResult = await knex.raw(sqlCode);
            log.info(sqlCode);
            //const jsonResult = updateResult.toJSON();
            return updateResult;
          } catch (err) {
            log.error(err);
          }
        };
      },
      deleteSingle(_parentNode, _node) {
        //log.debug('deleteSingle resolver not yet implemented');
        return () => {
          return {};
        };
      },
      deleteList(_parentNode, _node) {
        //log.debug('deleteList resolver not yet implemented');
        return () => {
          return {};
        };
      },
      treeParent(parentNode, node) {
        const contextLoaderKey = `${parentNode.name()}_${node.name()}_parentLoader`;
        
        return async function resolve(parentQueryResult, args, context, _info) {
          if (!context[contextLoaderKey]) {
            context[contextLoaderKey] = new DataLoader(async (keys) => {
              const parentIds = keys.map(key => key['parent_id']);
              const qb = knex(node.tableName).whereIn(`${node.tableName}.id`, parentIds);
              const result = await qb;
              const resultMap = result.reduce((acc, item) => {
                acc[item.id] = item;
                return acc;
              }, {});
              return keys.map(key => resultMap[key['parent_id']] || null);
            });
          }
          
          const dataLoader = context[contextLoaderKey];
          return dataLoader.load(parentQueryResult);
        };
      },
      treeChildren(parentNode, node) {
        const contextLoaderKey = `${parentNode.name()}_${node.name()}_childrenLoader`;
        
        return async function resolve(parentQueryResult, args, context, _info) {
          if (!context[contextLoaderKey]) {
            context[contextLoaderKey] = new DataLoader(async (keys) => {
              const parentIds = keys.map(key => key.id);

              // Query total count for pagination
              const countResults = await knex(node.tableName)
                .whereIn(`${node.tableName}.parent_id`, parentIds)
                .count(`${node.tableName}.id AS total`);

              // Create a map for total counts per parent_id
              const countMap = countResults.reduce((acc, result) => {
                acc[result.parent_id] = result.total;
                return acc;
              }, {});

              // Paginated query for child documents
              const qb = knex(node.tableName).whereIn(`${node.tableName}.parent_id`, parentIds);
              buildPagination(args, ({ page, pageSize }) => {
                qb.limit(pageSize);
                qb.offset((page - 1) * pageSize);
              });
              const docs = await qb;

              // Map the documents to their respective parent_ids
              const docsMap = keys.reduce((acc, key) => {
                acc[key.id] = [];
                return acc;
              }, {});

              docs.forEach((doc) => {
                if (docsMap[doc.parent_id]) {
                  docsMap[doc.parent_id].push(doc);
                }
              });

              return keys.map(key => ({
                docs: docsMap[key.id] || [],
                pagination: buildResultPagination(
                  countMap[key.id] || 0,
                  buildPagination(args)
                ),
              }));
            });
          }

          const dataLoader = context[contextLoaderKey];
          return dataLoader.load(parentQueryResult);
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
              commonDbQueries({ qb, args });
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
            commonDbQueries({ qb, args });
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
        /* 
        log.debug(
          'config.Reader.node()',
          configReader.node(preferredNode.capitalizedName()).denied()
        );
        */
        if (configReader.node(node.capitalizedName()).denied()) {
          return { error: { message: 'Access denied' } };
        }

        return async function resolve(parentQueryResult, args, context, _info) {
          try {
            log.info('node.tableName', node.tableName);
            // no need to batch in root query
            if (!parentQueryResult) {
              const qb = knex(node.tableName);
              //log.info('parentQueryResult', parentQueryResult);
              //log.info('args             ', args);
              //log.info('context          ', context);
              //log.info('info             ', _info);
              commonDbQueries({ qb, args });
              qb.limit(1);

              const resultList = await qb;
              return Promise.resolve(resultList[0]);
            }

            // This is not a root query
            const rootQueryRequestKey = `${parentNode.tableName}_${node.tableName}`;

            const contextLoaderKey = [parentNode, node]
              .filter((n) => n)
              .map((n) => n.name())
              .join('_');

            if (!context[contextLoaderKey]) {
              const dataLoader = new DataLoader(async (requestKeys) => {
                const fieldName = JSON.parse(requestKeys[0])[0];
                const ids = requestKeys.map((rk) => JSON.parse(rk)[1]);

                log.info('fieldName', fieldName);
                log.info('ids      ', ids);


                const qb = knex(node.tableName);
                qb.whereIn(fieldName, ids);
                qb.orderByRaw(`FIELD(${fieldName}, ${ids.join(',')})`);

                commonDbQueries({ qb, args });

                return qb;
              });
              context[contextLoaderKey] = dataLoader;
            }

            const dataLoader = context[contextLoaderKey];

            let requestKey = rootQueryRequestKey;

            buildDependentArgs(
              parentQueryResult,
              parentNode,
              node,
              ({ key, val }) => {
                requestKey = JSON.stringify([key, val]);
              }
            );
            return dataLoader.load(requestKey);
          } catch (err) {
            log.error(err);
          }
        };
      },
      list(parentNode, node) {
        const preferredNode = node || parentNode;
        //log.info('parent node', parentNode);
        //log.info('node       ', node);
        //const Model = modelBuilder.models.get(preferredNode.capitalizedName());
        /* 
        log.debug(
          'config.Reader.node()',
          configReader.node(`${preferredNode.capitalizedName()}List`).denied()
        );
        */
        //const Model = modelBuilder.models.get(node.capitalizedName());
        return async function resolve(parentQueryResult, args, context, _info) {
          try {
            if (configReader.node(`${node.capitalizedName()}List`).denied()) {
              return { error: { message: 'Access denied' } };
            }

            log.info('parentQueryResult', parentQueryResult);
            log.info('args             ', args);
            log.info('context          ', context);

            const rootQueryRequestKey = `root_${node.tableName}`;

            const contextLoaderKey = [parentNode, node]
              .filter((n) => n)
              .map((n) => n.name())
              .join('_');

            log.info('contextLoaderKey', contextLoaderKey);

            if (!context[contextLoaderKey]) {
              const dataLoader = new DataLoader(async (requestKeys) => {
                if (requestKeys.find((k) => k === rootQueryRequestKey)) {
                  const qb = knex(node.tableName);
                  commonDbQueries({ qb, args });
                  const qbCount = qb.clone();
                  const reqPagination = buildPagination(
                    args,
                    ({ page, pageSize }) => {
                      qb.offset((page - 1) * pageSize);
                      qb.limit(pageSize);
                    }
                  );

                  const countResult = await qbCount.count(
                    `${node.tableName}.id AS total`
                  );

                  const { total } = countResult[0];

                  log.info('total', total);

                  const resultPagination = buildResultPagination(
                    total,
                    reqPagination
                  );

                  const docs = await qb;
                  ensureListResultType(docs, node);

                  return Promise.resolve([
                    //{ docs: await qb, pagination: { total } },
                    { docs, pagination: resultPagination },
                  ]);
                } else {
                  // TODO Integrate countQueries into PaginationQueries
                  const mappedCountQueries = requestKeys.map((key) => {
                    const depArgs = JSON.parse(key);
                    const qb = knex(node.tableName);
                    qb.count(`${node.tableName}.id AS total`);
                    qb.select(depArgs[0]);
                    qb.where(...depArgs);
                    commonDbQueries({ qb, args });
                    return qb;
                  });

                  const mappedQueries = requestKeys.map((key) => {
                    const depArgs = JSON.parse(key);
                    const qb = knex(node.tableName);
                    qb.where(...depArgs);
                    commonDbQueries({ qb, args });
                    buildPagination(args, ({ page, pageSize }) => {
                      qb.limit(pageSize);
                      qb.offset((page - 1) * pageSize);
                    });
                    return qb;
                  });

                  let allCountResults = await knex.unionAll(
                    mappedCountQueries,
                    true
                  );

                  let allDocResults = await knex.union(
                    mappedQueries,
                    true
                  );

                  const reqPagination = buildPagination(args);

                  const filteredResults = requestKeys.map((reqKey) => {
                    const parsedKey = JSON.parse(reqKey);
                    const tableFieldName = parsedKey[0];
                    const tableFieldVal = parsedKey[1];
                    const fieldName = tableFieldName.split('.')[1];

                    const res = allCountResults.find((countItem) => {
                      return countItem[fieldName] === tableFieldVal;
                    });

                    /*
                    const { total } = allCountResults.find((countItem) => {
                      return countItem[fieldName] === tableFieldVal;
                    });
                    */
                    /*
                    const { total } = allCountResults.find((countItem) => {
                      return countItem[fieldName] === tableFieldVal;
                    });
                    */
                    const filteredDocResults = allDocResults.filter(
                      (resultItem) => {
                        return resultItem[fieldName] === tableFieldVal;
                      }
                    );
                    const resultPagination = buildResultPagination(
                      //0 || (res || {}).total,
                      0 || (res || { total: 0 }).total,
                      reqPagination
                    );
                    ensureListResultType(filteredDocResults, node);
                    return {
                      pagination: resultPagination,
                      docs: filteredDocResults,
                    };
                  });

                  return Promise.resolve(filteredResults); //Promise.all();
                }
              });
              context[contextLoaderKey] = dataLoader;
            }

            const dataLoader = context[contextLoaderKey];

            let requestKey = rootQueryRequestKey;

            buildDependentArgs(
              parentQueryResult,
              parentNode,
              node,
              ({ key, val }) => {
                requestKey = JSON.stringify([key, val]);
              }
            );

            const loaderResult = await dataLoader.load(requestKey);
            //log.info('loaderResult', loaderResult);
            return loaderResult;
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
