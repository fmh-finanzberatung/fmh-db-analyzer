function buildCompareFields(fieldDefs) {
  if (!fieldDefs || !fieldDefs.size) return '';
  const fields = Array.from(fieldDefs).map(([name, graphqlType]) => {
    return `${name}: ${graphqlType}Range`;
  });
  return `${fields.join('\n')}`;
}

module.exports = function GraphqlInputRangeBuilder(graphNode) {
  const pub = {
    fieldDefs: new Map(),
    result() {
      return `input ${graphNode.capitalizedName()}Range {
        ${buildCompareFields(pub.fieldDefs)}
      }`;
    },
  };

  pub.addFieldDef = function addFieldDef(name, graphqlType) {
    pub.fieldDefs.set(name, graphqlType);
  };

  return pub;
};
