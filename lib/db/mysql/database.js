//const knexConfig = require('../../../knexfile.js');
const Knex = require('knex');
const Bookshelf = require('bookshelf');
const cascadeDelete = require('bookshelf-cascade-delete');
const log = require('mk-log');

function Database(knexConfig) {
  const knex = Knex(knexConfig);
  const bookshelfInstance = Bookshelf(knex);
  // plugin registry is now part of core bookshelf
  // plugin virtuals is now part of core bookshelf
  bookshelfInstance.plugin('bookshelf-scopes');
  bookshelfInstance.plugin(cascadeDelete);

  //log.info('knexConfig', knexConfig);

  knex.toString();

  return {
    Bookshelf: bookshelfInstance,
    knex,
  };
}

module.exports = Database;
