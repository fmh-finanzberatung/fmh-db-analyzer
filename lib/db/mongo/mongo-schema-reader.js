const log = require('mk-log');

/*
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
*/

async function getCollectionDefinitions(db, collections) {
  try {
    const promises = collections.map((coll) => {
      //log.info('db       ', db);
      return db
        .collection(coll.name)
        .aggregate([
          { $project: { arrayofkeyvalue: { $objectToArray: '$$ROOT' } } },
          { $unwind: '$arrayofkeyvalue' },
          {
            $group: {
              _id: '$arrayofkeyvalue.k',
              value: {
                $first: '$arrayofkeyvalue.v',
              },
            },
          },
          {
            $group: {
              _id: coll.name,
              allkeysandvalues: {
                $push: {
                  k: '$_id',
                  v: { dataType: { $type: '$value' } },
                },
              },
            },
          },
          {
            $project: {
              allkeysandvalues: {
                $arrayToObject: '$allkeysandvalues',
              },
            },
          },
        ])
        .toArray();
    });

    const result = await Promise.all(promises);

    //log.info('result', JSON.stringify(result, null, 4));

    return result;
  } catch (err) {
    log.error(err);
  }
}

module.exports = async function MongoSchemaReader(db) {
  try {
    const collections = await db.listCollections().toArray();

    //log.info('collections', collections);

    const collectionDefinitions = await getCollectionDefinitions(
      db,
      collections
    );

    /*
    const metaSchemas = await knex('information_schema.tables')
      .select('table_name')
      .select('table_schema')
      //.from('information_schema.tables')
      .where('table_type', 'BASE TABLE')
      .andWhere('table_schema', databaseName);
    */
    //.andWhere('table_schema', 'database()')
    //.orderBy('database_name, table_name')

    //const tableDefinitions = await getTableDefintions(knex, metaSchemas);

    //log.debug('tableDefinitions', tableDefinitions);

    return collectionDefinitions;
  } catch (err) {
    log.error(err);
  }
};
