const tape = require('tape');
const log = require('mk-log');
const DbModelBuilder = require('../../lib/db/mysql/mysql-model-builder.js');
const journal = require('../mockups/journal.mockup.js');
const Path = require('path');
const knexConfig = require(Path.resolve('knexfile.js'));

const { Bookshelf } = require('../../lib/db/mysql/database.js')(knexConfig);

async function main() {
  await tape('Model Builder', async (t) => {
    try {
      const builder = DbModelBuilder(journal, Bookshelf);
      builder.run();

      //log.info('models', builder.models);

      builder.models.forEach(async (model, key) => {
        log.info('===================================================');
        //log.info('model', model);
        //log.info('key  ', key);
        //await model.query();
      });

      t.equals(
        builder.models.size,
        Array.from(journal.entries()).length,
        'generates same number of models'
      );
    } catch (err) {
      log.error(err);
    } finally {
      t.end();
    }
  });
}

main();
