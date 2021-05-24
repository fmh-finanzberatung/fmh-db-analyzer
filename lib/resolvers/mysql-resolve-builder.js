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
        return async function resolve(...resolveArguments) {
          try {
            //log.info(
            //`****************** item args: ${resolveArguments} parent:`
            //parent
            //);

            const { args, _parent } = deconstructResolveArgs(
              ...resolveArguments
            );
            log.info('args', args);
            const result = await Model.query((qb) => {
              buildWhereArgs(args, (whereItem) => {
                log.info('...whereItem', whereItem);
                qb.whereRaw(...whereItem);
              });
            }).fetch({});
            const jsonResult = result.toJSON();

            //log.info('jsonResult', jsonResult);
            return jsonResult;
          } catch (err) {
            log.error(err);
          }
        };
      },
      list(node) {
        const Model = modelBuilder.models.get(node.capitalizedName());
        /* 
        log.info(
          `--------------- list builder for : ${node.capitalizedName()}`
          //parent
        );
        */
        return async function resolve(...resolveArguments) {
          log.info(
            `****************** list args: ${resolveArguments} parent:`
            //parent
          );
          const { parent, args } = deconstructResolveArgs(...resolveArguments);

          log.info('args', args);

          const result = await Model.query((qb) => {
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
    };
  } catch (err) {
    log.info(err);
  }
};
