import tape from 'tape';
import log from 'mk-log';
import DbModelBuilder from '../../lib/db/mysql/mysql-model-builder.js';
import DbGraphNodeSupport from '../../lib/db/mysql/graph-node-support.js';
import JournalMockup from '../mockups/journal.mockup.js';
import knexConfig from '../../knexfile.js';
import Database from '../../lib/db/mysql/database.js';
import Knex from 'knex';
log.info('knexConfig:', knexConfig);
const knex = Knex(knexConfig);
const journal = JournalMockup(DbGraphNodeSupport);

async function main() {
  await tape('Model Builder', async (t) => {
    try {
      const builder = DbModelBuilder(journal, knex);
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
