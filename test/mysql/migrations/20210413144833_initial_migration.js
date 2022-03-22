const RandomString = require('../../../lib/utils/random-string.js');

exports.up = function (knex) {
  //   company <=> job <=> person  | company has many persons through jobs
  //   city             => person  | city has many persons

  return Promise.all([
    knex.schema.createTable('sessions', (t) => {
      t.increments('id').unsigned().primary();
      t.integer('user_id').unsigned().notNullable();
      t.uuid('key').defaultTo(knex.raw('(UUID())'));
      t.string('two_fa_key').defaultTo(`${RandomString(6).digits()}`);
      t.boolean('confirmed').defaultTo(false);
      t.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));
      t.timestamp('updated_at', { precision: 6 }).defaultTo(knex.fn.now(6));
    }),

    knex.schema.createTable('users', (t) => {
      t.increments('id').unsigned().primary();
      t.tinyint('active').defaultTo(0);
      t.string('name');
      t.string('email');
      t.string('hashed_password');
      t.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));
      t.timestamp('updated_at', { precision: 6 }).defaultTo(knex.fn.now(6));
    }),

    knex.schema.createTable('persons', (t) => {
      t.increments('id').unsigned().primary();
      t.tinyint('active');
      t.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));
      t.timestamp('updated_at', { precision: 6 }).defaultTo(knex.fn.now(6));
      t.datetime('employed_since');
      t.integer('job_id');
      t.integer('company_id');
      t.integer('age');
      t.string('family_name');
      t.string('given_name');
      t.string('city');
      t.index(['family_name', 'given_name'], 'person_full_name');
    }),

    knex.schema.createTable('jobs', (t) => {
      t.increments('id').unsigned().primary();
      t.tinyint('active');
      t.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));
      t.timestamp('updated_at', { precision: 6 }).defaultTo(knex.fn.now(6));
      t.integer('parent_id');
      t.integer('skill_level');
      t.string('title');
      t.index('title', 'job_title');
    }),

    knex.schema.createTable('companies', (t) => {
      t.increments('id').unsigned().primary();
      t.tinyint('active');
      t.string('legal_name');
      t.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));
      t.timestamp('updated_at', { precision: 6 }).defaultTo(knex.fn.now(6));
      t.index('legal_name', 'company_legal_name');
    }),
  ]);
};

exports.down = function (knex) {
  return Promise.all([
    knex.schema.dropTable('sessions'),
    knex.schema.dropTable('persons'),
    knex.schema.dropTable('jobs'),
    knex.schema.dropTable('companies'),
  ]);
};
