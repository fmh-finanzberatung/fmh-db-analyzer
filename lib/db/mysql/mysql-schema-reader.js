const log = require('mk-log');

function tableQuery(knex, tableSchema, tableName) {
  const query = knex('INFORMATION_SCHEMA.COLUMNS')
    .select('*')
    //.from('INFORMATION_SCHEMA.COLUMNS')
    .where('TABLE_SCHEMA', tableSchema)
    .andWhere('TABLE_NAME', tableName);
  log.debug('query', query);
  return query;
}

function getTableDefintions(knex, metaSchemas) {
  const tableQueries = metaSchemas.map((rowItem) =>
    tableQuery(knex, rowItem.table_schema, rowItem.table_name)
  );

  return Promise.all(tableQueries);
}

module.exports = async function MysqlSchemaReader(knex) {
  log.info('MysqlSchemaReader', knex);
  const databaseName = knex.client.connectionSettings.database;

  const metaSchemas = await knex('information_schema.tables')
    .select('table_name')
    .select('table_schema')
    //.from('information_schema.tables')
    .where('table_type', 'BASE TABLE')
    .andWhere('table_schema', databaseName);
  //.andWhere('table_schema', 'database()')
  //.orderBy('database_name, table_name')

  const tableDefinitions = await getTableDefintions(knex, metaSchemas);

  //log.debug('tableDefinitions', tableDefinitions);

  return tableDefinitions;
};
