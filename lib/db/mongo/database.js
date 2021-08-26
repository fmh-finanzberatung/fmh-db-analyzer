const { MongoClient } = require('mongodb');
const log = require('mk-log');

module.exports = async function database(mongoConfig) {
  try {
    const host = mongoConfig.host;
    const dbName = mongoConfig.dbName;

    log.info('host  ', host);
    log.info('dbName', dbName);

    const url = `mongodb://${host}:27017/${dbName}`;
    // returns a promise
    const client = new MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    log.info(await client.connect());

    //log.info('client db', client.db(dbName).collection('persons').find());

    return client.db(dbName);
  } catch (err) {
    log.error(err);
  }
};
