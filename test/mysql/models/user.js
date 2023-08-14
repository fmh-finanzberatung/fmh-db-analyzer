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
