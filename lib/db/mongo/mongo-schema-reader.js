const log = require('mk-log');
const parseSchema = require('mongodb-schema');

module.exports = async function MongoSchemaReader(db) {
  try {
    log.debug('db', db);

    const collections = await db.listCollections().toArray();

    const collectionNames = collections.map((coll) => coll.name);

    const collectionPromises = collectionNames.map((collName) =>
      parseSchema(db.collection(collName).find(), {
        semanticTypes: true,
      })
    );

    const results = await Promise.all(collectionPromises);

    log.debug('collectionNames.length', collectionNames.length);
    log.debug('results.length', results.length);

    // attach collection name to collection schema object
    const namedResults = results.map((resultItem, index) => {
      resultItem.name = collectionNames[index];
      return resultItem;
    });

    return namedResults;
  } catch (err) {
    log.error(err);
  }
};
