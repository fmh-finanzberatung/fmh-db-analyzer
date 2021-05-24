function traverse(startName, name, parent, journal, level, cb) {
  cb(name, parent, level);
  const node = journal.get(name);
  if (!node) return false;
  node.edges.forEach((childName) => {
    if (startName === childName) {
      return null;
    }
    traverse(startName, childName, name, journal, level + 1, cb);
  });
}

module.exports = function traverseNodes(name, journal, cb) {
  traverse(name, name, null, journal, 0, cb);
};
