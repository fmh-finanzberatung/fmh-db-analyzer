module.exports = function Company(Bookshelf) {
  const CompanyModel = Bookshelf.Model.extend({
    tableName: 'companies',
    debug: true,
    hasTimestamps: true,
    legal_name: String,
    city: String,
  });

  // register model for circular reference
  Bookshelf.model('Company', CompanyModel);
  return CompanyModel;
};
