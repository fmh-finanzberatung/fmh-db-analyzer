import log from 'mk-log';
// const path = require('path');
import knexfile from '../../../knexfile-test.js';
import hashKey from '../../../lib/utils/hash-key.js';
const env = process.env.NODE_ENV || 'development';
const config = await import(`../../../config/env/${env}-config.js`);
log.info('config', config);
const hashSalt = config.default.hashSalt;
import Knex from 'knex';
import DbSchemaReader from '../../../lib/db/mysql/mysql-schema-reader.js';
import DbHelpers from '../../../lib/db/mysql/db-helpers.js';
const knex = Knex(knexfile);

function tableNamesReducer(reducer, row) {
  if (reducer.toString() !== '[object Set]') {
    throw new Error('reducer is not a Set');
  }
  const tableName = row.TABLE_NAME;
  reducer.add(tableName);
  return reducer;
}

const { insert } = DbHelpers(knex);

export default async function create() {
  try {
    const dbSchemaReader = await DbSchemaReader(knex);
    const rows = dbSchemaReader.flat();
    log.info(rows);
    const tableNames = rows
      .filter((row) => !row.TABLE_NAME.match(/knex/))
      .reduce(tableNamesReducer, new Set());
    log.info(tableNames);
    const tableNamesList = Array.from(tableNames);
    const tablesDelQueries = tableNamesList.map((tableName) => {
      return knex.raw(`DELETE FROM ${tableName}`);
    });
    await Promise.all(tablesDelQueries);

    const personMaster = await insert({
      table: 'persons',
      data: {
        given_name: 'The',
        family_name: 'Master',
        email: 'master@galt.de',
        hashed_password: hashKey('3333', { salt: hashSalt }).create(),
      },
    });

    // create initial session for master
    const personMasterSession = await insert({
      table: 'sessions',
      data: {
        person_id: personMaster.id,
      },
    });

    const companyFreeBSD = await insert({
      table: 'companies',
      data: {
        legal_name: 'FreeBSD Inc',
      },
    });

    const manufacturerFord = await insert({
      table: 'manufacturers',
      data: {
        name: 'Ford',
      },
    });

    const manufacturerVolvo = await insert({
      table: 'manufacturers',
      data: {
        name: 'Volvo',
      },
    });

    const companyLinux = await insert({
      table: 'companies',
      data: {
        legal_name: 'FreeBSD Inc',
      },
    });

    const jobSenior = await insert({
      table: 'jobs',
      data: {
        parent_id: null,
        active: true,
        title: 'Senior Engineer',
        skill_level: 10,
      },
    });

    const jobEngineerInterior = await insert({
      table: 'jobs',
      data: {
        active: true,
        title: 'Engineer Interior',
        skill_level: 5,
        parent_id: jobSenior.id,
      },
    });

    const jobEngineerExterior = await insert({
      table: 'jobs',
      data: {
        active: true,
        title: 'Engineer Exterior',
        skill_level: 3,
        parent_id: jobSenior.id,
      },
    });

    const personA = await insert({
      table: 'persons',
      data: {
        active: true,
        employed_since: '2010-10-01',
        given_name: 'John',
        family_name: 'Galt',
        age: 38,
        company_id: companyFreeBSD.id,
        job_id: jobSenior.id,
        city: 'Gulch',
      },
    });

    const personB = await insert({
      table: 'persons',
      data: {
        active: true,
        employed_since: '2015-05-12',
        given_name: 'Dagny',
        family_name: 'Taggart',
        age: 35,
        company_id: companyLinux.id,
        job_id: jobEngineerInterior.id,
        city: 'New York',
      },
    });

    const personC = await insert({
      table: 'persons',
      data: {
        active: false,
        employed_since: '2020-09-08',
        given_name: 'Hank',
        family_name: 'Rearden',
        age: 42,
        company_id: companyFreeBSD.id,
        job_id: jobEngineerExterior.id,
        city: 'Chicago',
      },
    });

    const personD = await insert({
      table: 'persons',
      data: {
        active: false,
        employed_since: '2020-09-08',
        given_name: 'Ragnar',
        family_name: 'Danneskjold',
        age: 39,
        company_id: companyLinux.id,
        job_id: jobEngineerExterior.id,
        city: 'Stockholm',
      },
    });

    const carA = await insert({
      table: 'cars',
      data: {
        name: 'Mustang',
        person_id: personA.id,
        manufacturer_id: manufacturerFord.id,
      },
    });

    const carB = await insert({
      table: 'cars',
      data: {
        name: 'XC90',
        person_id: personB.id,
        manufacturer_id: manufacturerVolvo.id,
      },
    });

    return {
      data: {
        personMaster: personMaster,
        companyFreeBSD: companyFreeBSD,
        companyLinux: companyLinux,
        jobSenior: jobSenior,
        jobEngineerInterior: jobEngineerInterior,
        jobEngineerExterior: jobEngineerExterior,
        personA: personA,
        personB: personB,
        personC: personC,
        personD: personD,
        carA: carA,
        carB: carB,
        manufacturerFord: manufacturerFord,
        manufacturerVolvo: manufacturerVolvo,
      },
    };
  } catch (err) {
    log.error(err);
  }
};
