module.exports = function Session(Bookshelf) {
  const SessionModel = Bookshelf.Model.extend({
    tableName: 'sessions',
    debug: true,
    hasTimestamps: true,
    sessionKey: String, // should be uuid
  });

  // register model for circular reference
  Bookshelf.model('Session', SessionModel);
  return SessionModel;
};
