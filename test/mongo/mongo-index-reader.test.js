const tape = require('tape');
const knexFile = require('../knexfile.js');
const knex = require('knex')(knexFile);
const log = require('mk-log');
const DbIndexReader = require('../lib/db-index-reader');

async function main() {
  tape(async (t) => {
    const indexInfo = await DbIndexReader(knex);
    log.info(indexInfo); 
    t.true(indexInfo.length > 0);
  });
}

main();
