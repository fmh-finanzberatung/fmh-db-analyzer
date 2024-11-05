import log from 'mk-log';
const knexfile = await import('../knexfile.js');
import Knex from 'knex';
const knex = Knex(knexfile.default);
log.info('knexfile', knexfile);
log.info('knex    ', knex);
import createModel from '../lib/db/mysql/create-model.js';

import { Model } from 'objection';
const hasTable = await knex.schema.hasTable('persons');

const personDef = {
  tableName: 'persons',
  virtuals: {
    fullName: {
      get() {
        return `${this.givenName} ${this.familyName}`;
      },
      set(fullName) {
        const parts = fullName.split(' ');
        this.givenName = parts[0];
        this.familyName = parts[1];
      },
    },
  },
  jsonSchema: {
    type: 'object',
    required: ['givenName', 'familyName', 'email'],
    properties: {
      id: { type: 'integer' },
      active: { type: 'integer' }, 
      created_at: { type: 'string' },
      updated_at: { type: 'string' },
      givenName: { type: 'string', minLength: 1, maxLength: 255 },
      familyName: { type: 'string', minLength: 1, maxLength: 255 },
      email: { type: 'string', minLength: 1, maxLength: 255 },
      hashed_password: { type: 'string', minLength: 1, maxLength: 255 },
    },
  },
  relationMappings: {
    role: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => createModel(roleDef, knex),
      join: {
        from: 'persons.role_id',
        to: 'roles.id',
      },
    },
    cars: {
      relation: Model.HasManyRelation,
      modelClass: () => createModel(carDef, knex),
      join: {
        from: 'persons.id',
        to: 'cars.person_id',
      },
    },
    manufacturers: {
      relation: Model.ManyToManyRelation,
      modelClass: () => createModel(manufacturerDef, knex),
      join: {
        from: 'persons.id',
        through: {
          from: 'cars.person_id',
          to: 'cars.manufacturer_id',
        },
        to: 'manufacturers.id',
      },
    },
    sessions: {
      relation: Model.HasManyRelation,
      modelClass: () => createModel(sessionDef, knex),
      join: {
        from: 'persons.id',
        to: 'sessions.person_id',
      },
    },
  },
};

const sessionDef = {
  tableName: 'sessions',
  jsonSchema: {
    type: 'object',
    required: ['sessionKey'],
    properties: {
      id: { type: 'integer' },
      created_at: { type: 'string' },
      updated_at: { type: 'string' },
      active: { type: 'boolean' },
      token: { type: 'string' },
      person_id: { type: 'integer' },
    },
  },
};

const carDef = {
  tableName: 'cars',
  jsonSchema: {
    type: 'object',
    required: ['name'],
    properties: {
      id: { type: 'integer' },
      created_at: { type: 'string' },
      updated_at: { type: 'string' },
      person_id: { type: 'integer' },
      manufacturer_id: { type: 'integer' },
      active: { type: 'boolean' },
      name: { type: 'string' },
    },
  },
  relationMappings: {
    manufacturer: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => createModel(manufacturerDef, knex),
      join: {
        from: 'cars.manufacturer_id',
        to: 'manufacturers.id',
      },
    },
    person: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => createModel(personDef, knex),
      join: {
        from: 'cars.person_id',
        to: 'persons.id',
      },
    },
  },
};

const manufacturerDef = {
  tableName: 'manufacturers',
  jsonSchema: {
    type: 'object',
    required: ['name'],
    properties: {
      created_at: { type: 'string' },
      updated_at: { type: 'string' },
      id: { type: 'integer' },
      active: { type: 'boolean' },
      name: { type: 'string' },
    },
  },
  relationMappings: {
    persons: {
      relation: Model.HasManyToManyRelation,
      modelClass: () => createModel(personDef, knex),
      join: {
        from: 'manufacturers.id',
        through: {
          from: 'cars.manufacturer_id',
          to: 'cars.person_id',
        },
        to: 'persons.id',
      },
    },
    cars: {
      relation: Model.HasManyRelation,
      modelClass: () => createModel(carDef, knex),
      join: {
        from: 'manufacturers.id',
        to: 'cars.manufacturer_id',
      },
    },
  },
};

/* add role later
const roleDef = {
  tableName: 'roles',
  jsonSchema: {
    type: 'object',
    required: ['name'],
    properties: {
      id: { type: 'integer' },
      created_at: { type: 'string' },
      updated_at: { type: 'string' },
      name: { type: 'string' },
      permissions: { type: 'string' },
    },
  },
  relationMappings: {
    persons: {
      relation: Model.HasManyRelation,
      modelClass: 'Person',
      join: {
        from: 'roles.id',
        to: 'persons.role_id',
      },
    },
  }
};
*/

const carModel = createModel(carDef, knex);
log.info('carModel', await carModel.query().limit(1));
const manufacturerModel = createModel(manufacturerDef, knex);
log.info('manufacturerModel', await manufacturerModel.query().limit(1));
log.info('A manufacturer\'s cars', JSON.stringify(await manufacturerModel.query().withGraphFetched('cars'), null, 2));
const personModel = createModel(personDef, knex);
log.info('personModel', await personModel.query().limit(1)); 
log.info('A person\'s cars', await personModel.relatedQuery('cars').for(1));
const sessionModel = createModel(sessionDef, knex);
log.info('sessionModel', await sessionModel.query().limit(1));
