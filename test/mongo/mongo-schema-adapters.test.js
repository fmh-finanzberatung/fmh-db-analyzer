const tape = require('tape');
const mongoFile = require('../../mongofile.js');
const Database = require('../../lib/db/mongo/database.js');
const log = require('mk-log');
const MongoSchemaReader = require('../../lib/db/mongo/mongo-schema-reader');
const MongoSchemaAdapters = require('../../lib/db/mongo/mongo-schema-adapters.js');

async function main() {
  await tape(async (t) => {
    try {
      const client = await Database(mongoFile);
      const db = client.db(mongoFile.dbName);
      const metaSchema = await MongoSchemaReader(db);
      const journal = MongoSchemaAdapters(metaSchema);

      log.debug('journal', journal);

      /* 
      const mongoModelBuilder = MongoModelBuilder(journal);

      dbModelBuilder.tap('schemaDef', 'Person', (SchemaDef, _node) => {
        SchemaDef.outputVirtuals = true;
        SchemaDef.virtuals = {
          fullName() {
            return `${this.get('first_name')} ${this.get('last_name')}`;
          },
        };
      });
      mongoModelBuilder.run();

      const CarModel = mongoModelBuilder.models.get('Car');
      await destroyAll(CarModel);
      const car = await CarModel.forge({ make: 'Not a Tesla' }).save();
      const carResult = await CarModel.where(
        'make',
        '=',
        'Not a Tesla'
      ).fetchAll();

      const CompanyModel = mongoModelBuilder.models.get('Company');
      await destroyAll(CompanyModel);
      const company = await CompanyModel.forge({ name: 'FreeBSD' }).save();
      t.ok(company);
      const companyResult = await CompanyModel.where(
        'name',
        '=',
        'FreeBSD'
      ).fetchAll();

      const PersonModel = dbModelBuilder.models.get('Person');

      await destroyAll(PersonModel);
      const person = await PersonModel.forge({
        given_name: 'John',
        family_name: 'Galt',
        car_id: car.id,
      }).save();
      t.ok(person);
      const personResult = await PersonModel.where(
        'last_name',
        '=',
        'Galt'
      ).fetch({ withRelated: ['car'] });

      //log.info('personresult raw ', personResult);
      //log.info('personresult json', personResult.toJSON({ virtuals: true }));
      //log.info('personresult raw  fullName', personResult.fullName);

      //t.equals(personResult.fullName, 'John Galt');

      //log.info('after run');
      */
    } catch (err) {
      log.error(err);
    } finally {
      t.end();
      process.exit(0);
    }
  });
}

main();
