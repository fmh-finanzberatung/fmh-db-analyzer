module.exports = function Job(Bookshelf) {
  const JobModel = Bookshelf.Model.extend({
    tableName: 'jobs',
    debug: true,
    hasTimestamps: true,
    parent_id: { type: 'integer' },
    person_id: { type: 'integer' },
    company_id: { type: 'integer' },
    title: String,
  });

  // register model for circular reference
  Bookshelf.model('Job', JobModel);
  return JobModel;
};
