module.exports = function buildGraphlTypeFields(fieldDefs) {
  if (!fieldDefs || !fieldDefs.size) return '';
  const fields = Array.from(fieldDefs).map(([name, graphqlType]) => {
    return `${name}: ${graphqlType}`;
  });
  return `${fields.join('\n')}`;
};
