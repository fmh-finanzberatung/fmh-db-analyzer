import { Model } from 'objection';
import { timestamps } from 'objection-timestamps';

class UserModel extends timestamps()(Model) {
  static get tableName() {
    return 'users';
  }

  static get debug() {
    return true;
  }

  static get hasTimestamps() {
    return true;
  }

  static get active() {
    return Boolean;
  }

  static get name() {
    return String;
  }

  static get email() {
    return String;
  }

  static get hashed_password() {
    return String;
  }
}

export default UserModel;

/*
module.exports = function User(Bookshelf) {
  const UserModel = Bookshelf.Model.extend({
    tableName: 'users',
    debug: true,
    hasTimestamps: true,
    active: Boolean,
    name: String,
    email: String,
    hashed_password: String,
  });

  // register model for circular reference
  Bookshelf.model('User', UserModel);
  return UserModel;
};
*/
