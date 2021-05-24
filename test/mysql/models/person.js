module.exports = function Person(Bookshelf) {
  const PersonModel = Bookshelf.Model.extend({
    tableName: 'persons',
    debug: true,
    hasTimestamps: true,
    car_id: { type: 'integer' },
    age: { type: 'integer' },
    given_name: String,
    family_name: String,
    city: String,
  });

  // register model for circular reference
  Bookshelf.model('Person', PersonModel);
  return PersonModel;
};
