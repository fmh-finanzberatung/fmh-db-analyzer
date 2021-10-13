const mongoFile = require('../../../mongofile.js');
const database = require('../../../lib/db/mongo/database.js');
const log = require('mk-log');

module.exports = async function create() {
  try {
    //const client = await database(mongoFile);
    
    const db = await database(mongoFile);

    log.info(db);

    await db.collection('companies').deleteMany();
    const resCompany = await db.collection('companies').insertOne({
      legalName: 'FreeBSD',
      jobs: [],
    });

    const company = resCompany.ops[0];

    const blankCompany = await db.collection('companies').insertOne({
      legalName: 'Blank',
    });
    const blComp = blankCompany.ops[0];

    log.info('blComp', blComp);

    await db.collection('jobs').deleteMany();

    const resJobSenior = await db
      .collection('jobs')
      .insertOne({ title: 'Senior Engineer' });
    const jobSenior = resJobSenior.ops[0];

    const resJobA = await db.collection('jobs').insertOne({
      parent: jobSenior._id,
      title: 'Engineer Interior',
    });
    const jobA = resJobA.ops[0];

    const resJobB = await db
      .collection('jobs')
      .insertOne({ parent: jobSenior._id, title: 'Engineer exterior' });

    const jobB = resJobB.ops[0];

    await db.collection('persons').deleteMany();
    const resPersonA = await db.collection('persons').insertOne({
      givenName: 'John',
      familyName: 'Galt',
      age: 38,
      company: company._id,
      job: jobSenior._id,
      city: 'Gulch',
    });

    const personA = resPersonA.ops[0];

    const resPersonB = await db.collection('persons').insertOne({
      givenName: 'Dagny',
      familyName: 'Taggart',
      age: 35,
      companyId: company._id,
      job: jobA._id,
      city: 'New York',
    });

    const personB = resPersonB.ops[0];

    const resPersonC = await db.collection('persons').insertOne({
      givenName: 'Hank',
      familyName: 'Rearden',
      age: 42,
      companyId: company._id,
      job: jobB._id,
      city: 'Chicago',
    });
    const personC = resPersonC.ops[0];

    await db
      .collection('companies')
      .updateOne(
        { legalName: 'FreeBSD' },
        { $set: { jobs: [jobSenior._id, jobA._id, jobB._id] } },
        { upsert: true }
      );

    return {
      data: {
        company,
        jobSenior,
        jobA,
        jobB,
        personA,
        personB,
        personC,
      },
      db,
    };
  } catch (err) {
    log.error(err);
  }
};
