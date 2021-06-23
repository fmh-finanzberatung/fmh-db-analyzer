module.exports = async function DbIndexReader(knex) {
  const databaseName = knex.client.connectionSettings.database;
  return await knex('INFORMATION_SCHEMA.STATISTICS')
    .select('*')
    .where('TABLE_SCHEMA', databaseName)
    .groupBy('TABLE_NAME')
    .groupBy('INDEX_NAME')
    .connection();
};
