const MysqlSchemaAdapters = require('../db/mysql/mysql-schema-adapters.js');
const MysqlModelBuilder = require('../db/mysql/mysql-model-builder.js');
const MysqlSchemaReader = require('../db/mysql/mysql-schema-reader.js');
const Database = require('../db/mysql/database');
//const deconstructResolveArgs = require('../utils/deconstruct-resolve-args');
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

function buildDependentArgs(node, parentResult, fn) {
  if (!parentResult) return false;
  const dependentKey = `${node.name()}_id`;
  const parentVal = parentResult[dependentKey];
  if (parentVal) {
    fn([`${node.tableName}.id = ?`, [`${parentVal}`]]);
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
      item(node) {
        const Model = modelBuilder.models.get(node.capitalizedName());

        return async function resolve(parentResult, args, _ast) {
          try {
            const dbQuery = Model.query((qb) => {
              buildDependentArgs(node, parentResult, (whereItem) => {
                log.info('...dependentItem', whereItem);
                qb.whereRaw(...whereItem);
              });
              buildWhereArgs(args, (whereItem) => {
                log.info('...whereItem', whereItem);
                qb.whereRaw(...whereItem);
              });
            });

            // set require: false in order to return null
            // instead of NotFoundError
            const result = await dbQuery.fetch({ require: false });
            const jsonResult = result.toJSON();
            log.info('jsonResult', jsonResult);
            return jsonResult;
          } catch (err) {
            log.error(err);
          }
        };
      },
      list(node) {
        const Model = modelBuilder.models.get(node.capitalizedName());
        return async function resolve(parentResult, args) {
          const result = await Model.query((qb) => {
            buildWhereArgs(args, (whereItem) => {
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
        };
      },
    };
  } catch (err) {
    log.info(err);
  }
};
