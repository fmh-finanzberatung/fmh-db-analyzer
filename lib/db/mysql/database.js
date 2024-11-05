//const knexConfig = require('../../../knexfile.js');
import { Model } from 'objection';
import Knex from 'knex';

function Database(knexConfig) {
  const knex = Knex(knexConfig);

  const result = Model.knex(knex);

  console.log('lib/db/mysql/database.js result', result);

  return {
    knex,
    Database: result,
  };
}

export default Database;
