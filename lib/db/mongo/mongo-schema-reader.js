const log = require('mk-log');

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
                  v: { DATA_TYPE: { $type: '$value' } },
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

    const flattenedResult = result.flat();

    for (let i = 0, l = flattenedResult.length; i < l; i++) {
      const docDef = flattenedResult[i];
      const collName = docDef._id;
      console.log('collName', collName);
      const allkeysandvalues = docDef['allkeysandvalues'];
      for (const [key, value] of Object.entries(allkeysandvalues)) {
        //log.info('key', key);
        //log.info('value', value);
        if (value['DATA_TYPE'] === 'array') {
          log.info('collName', docDef._id);
          log.info('key             ', key);
          log.info('value[DATA_TYPE]', value['DATA_TYPE']);
          const collResult = await db.collection(collName).findOne({
            [`${collName}.${key}`]: { $type: 'objectId' },
          });
          log.info('collResult', collResult);
        }
      }
    }

    //log.info(result);

    //log.info('result', JSON.stringify(result, null, 4));

    return result;
  } catch (err) {
    log.error(err);
  }
}

module.exports = async function MongoSchemaReader(db) {
  try {
    log.info('db', db);

    const collections = await db.listCollections().toArray();

    log.info('collections', collections);

    const collectionDefinitions = await getCollectionDefinitions(
      db,
      collections
    );

    return collectionDefinitions;
  } catch (err) {
    log.error(err);
  }
};
