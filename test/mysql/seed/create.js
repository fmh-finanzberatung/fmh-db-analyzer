const glob = require('fast-glob');
const capitalize = require('../../../lib/utils/capitalize.js');
const destroyAllRecords = require('../utils/destroy-all.js');
const log = require('mk-log');
const path = require('path');
const knexfile = require('../../../knexfile.js');
const Database = require('../../../lib/db/mysql/database.js');

module.exports = async function create() {
  try {
    const Bookshelf = Database(knexfile).Bookshelf;
    const modelFiles = await glob(path.resolve('./test/mysql/models/*.js'));

    const models = modelFiles.reduce((map, filePath) => {
      const Model = require(filePath)(Bookshelf);
      const modelName = capitalize(path.parse(filePath).name);
      map.set(modelName, Model);
      return map;
    }, new Map());

    const destroyAllTables = Array.from(models).map(([_, m]) => {
      return destroyAllRecords(m);
    });

    await Promise.all(destroyAllTables);

    const CompanyModel = models.get('Company');
    const companyFreeBSD = await CompanyModel.forge({
      legal_name: 'FreeBSD Inc',
    }).save();
    const companyLinux = await CompanyModel.forge({
      legal_name: 'Linux Ltd',
    }).save();
    const JobModel = models.get('Job');
    const jobSenior = await JobModel.forge({
      parent_id: null,
      active: true,
      title: 'Senior Engineer',
      skill_level: 10,
    }).save();
    const jobA = await JobModel.forge({
      active: true,
      title: 'Engineer Interior',
      skill_level: 5,
      parent_id: jobSenior.id,
    }).save();
    const jobB = await JobModel.forge({
      active: true,
      title: 'Engineer Exterior',
      skill_level: 3,
      parent_id: jobSenior.id,
    }).save();
    const PersonModel = models.get('Person');
    const personA = await PersonModel.forge({
      active: true,
      employed_since: '2010-10-01',
      given_name: 'John',
      family_name: 'Galt',
      age: 38,
      company_id: companyFreeBSD.id,
      job_id: jobSenior.id,
      city: 'Gulch',
    }).save();
    const personB = await PersonModel.forge({
      active: true,
      employed_since: '2015-05-12',
      given_name: 'Dagny',
      family_name: 'Taggart',
      age: 35,
      company_id: companyLinux.id,
      job_id: jobA.id,
      city: 'New York',
    }).save();
    const personC = await PersonModel.forge({
      active: false,
      employed_since: '2020-09-08',
      given_name: 'Hank',
      family_name: 'Rearden',
      age: 42,
      company_id: companyFreeBSD.id,
      job_id: jobB.id,
      city: 'Chicago',
    }).save();
    const personD = await PersonModel.forge({
      active: false,
      employed_since: '2020-09-08',
      given_name: 'Ragnar',
      family_name: 'Danneskjold',
      age: 39,
      company_id: companyLinux.id,
      job_id: jobB.id,
      city: 'Stockholm',
    }).save();

    return {
      models,
      data: {
        companyFreeBSD: companyFreeBSD.toJSON(),
        companyLinux: companyLinux.toJSON(),
        jobSenior: jobSenior.toJSON(),
        jobA: jobA.toJSON(),
        jobB: jobB.toJSON(),
        personA: personA.toJSON(),
        personB: personB.toJSON(),
        personC: personC.toJSON(),
        personD: personD.toJSON(),
      },
    };
  } catch (err) {
    log.error(err);
  }
};
