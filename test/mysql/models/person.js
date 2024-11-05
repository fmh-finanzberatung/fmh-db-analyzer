import { Model } from 'objection';
import { timestamps } from 'objection-timestamps';

class SessionModel extends timestamps()(Model) {
  static get tableName() {
    return 'persons';
  }

  static get debug() {
    return true;
  }

  static get hasTimestamps() {
    return true;
  }

  static get sessionKey() {
    return String; // should be uuid
  }

  static get car_id() {
    return { type: 'integer' };
  }

  static get age() {
    return { type: 'integer' };
  }

  static get given_name() {
    return String;
  }

  static get family_name() {
    return String;
  }

  static get city() {
    return String;
  }
  
  /*
  static get relationMappings() {
    return {
      car: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Car',
        join: {
          from: 'persons.car_id',
          to: 'cars.id',
        },
      },
    };
  }
  */
}

export default SessionModel;
/*
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
*/
