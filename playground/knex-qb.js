import log from 'mk-log';
const knexfile = await import('../knexfile.js');
import Knex from 'knex';
const knex = Knex(knexfile.default);
log.info('knexfile', knexfile);
log.info('knex    ', knex);


const qb = knex('persons').select('*');
const result = await qb;

log.info('result', result);

const rawResult = await knex.raw('select * from cars');
log.info('rawResult', rawResult);
