module.exports = function Helpers(knex) {

  return {
    async insert({ table, data }) {
      const result = await knex(table).insert(data);
      const recordId = result[0];
      const records = await knex(table).where({ id: recordId }).select('*');
      return records[0];
    }
  };

};
