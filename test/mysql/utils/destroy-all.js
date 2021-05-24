module.exports = async function destroyAll(Model) {
  const records = await Model.fetchAll();
  const destroyPromises = records.map((r) => r.destroy());
  return Promise.all(destroyPromises);
};
