const log = require('mk-log');
const createSeed = require('./create.js');

async function main() {
  try {
    const conn = await createSeed();
     
    //log.info('db', conn.db);
    //log.info('conn', conn);

    //const collection = conn.db.collection('persons');

    process.exit(0);
  } catch (err) {
    log.error(err);
  }
}

main();
