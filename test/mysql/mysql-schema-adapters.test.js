const tape = require('tape');
const knexConfig = require('../../knexfile.js');
const log = require('mk-log');
const destroyAll = require('./utils/destroy-all');

const MysqlSchemaAdapters = require('../../lib/db/mysql/mysql-schema-adapters.js');
const MysqlSchemaReader = require('../../lib/db/mysql/mysql-schema-reader.js');
//const DbIndexReader = require('../lib/db-index-reader.js');
const MysqlModelBuilder = require('../../lib/db/mysql/mysql-model-builder.js');
const Database = require('../../lib/db/mysql/database.js');

async function main() {
  await tape(async (t) => {
    try {
      const database = Database(knexConfig);

      const metaSchemas = await MysqlSchemaReader(database.knex);

      //const indexDefs = await DbIndexReader(knex);

      const journal = MysqlSchemaAdapters(metaSchemas);
      const dbModelBuilder = MysqlModelBuilder(journal, database.Bookshelf);

      dbModelBuilder.tap('schemaDef', 'Person', (SchemaDef, _node) => {
        SchemaDef.outputVirtuals = true;
        SchemaDef.virtuals = {
          fullName() {
            return `${this.get('first_name')} ${this.get('last_name')}`;
          },
        };
      });
      dbModelBuilder.run();

      const CompanyModel = dbModelBuilder.models.get('Company');
      await destroyAll(CompanyModel);
      const company = await CompanyModel.forge({ legal_name: 'FreeBSD' }).save();
      t.ok(company);
      const companyResult = await CompanyModel.where(
        'legal_name',
        '=',
        'FreeBSD'
      ).fetchAll();

      const PersonModel = dbModelBuilder.models.get('Person');

      await destroyAll(PersonModel);
      const person = await PersonModel.forge({
        given_name: 'John',
        family_name: 'Galt'
      }).save();
      t.ok(person);
      const personResult = await PersonModel.where(
        'family_name',
        '=',
        'Galt'
      ).fetch();

      //log.info('personresult raw ', personResult);
      //log.info('personresult json', personResult.toJSON({ virtuals: true }));
      //log.info('personresult raw  fullName', personResult.fullName);

      //t.equals(personResult.fullName, 'John Galt');

      //log.info('after run');
    } catch (err) {
      log.error(err);
    } finally {
      t.end();
      process.exit(0);
    }
  });
}

main();
