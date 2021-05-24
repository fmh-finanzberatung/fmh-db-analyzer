const tape = require('tape');
const log = require('mk-log');
const DbModelBuilder = require('../../lib/db/mysql/mysql-model-builder.js');
const journal = require('../mockups/journal.mockup.js');
const Bookshelf = require('../../lib/db/mysql/database');

tape('Model Builder', (t) => {
  const builder = DbModelBuilder(journal, Bookshelf);

  builder.addModelListener(async (_journalKey, _generatedModel) => {
    //const targetPath = path.resolve(
    //  path.join(__dirname, 'results/db', `${journalKey}.js`)
    //);
    //log.info('writing file', targetPath);
    //const formatedModel = prettier.format(generatedModel, prettierOptions);
    //log.info('formatedModel', formatedModel);
    //await fs.writeFile(targetPath, formatedModel);
  });
  builder.run();

  builder.list.forEach(async (m) => {
    log.info('===================================================');
    log.info(m);
    await m.query();
  });

  t.equals(
    builder.list.length,
    Array.from(journal.entries()).length,
    'generates same number of models'
  );

  t.end();
});
