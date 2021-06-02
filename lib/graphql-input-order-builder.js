function buildOrderTypeFields(fieldNames) {
  if (!fieldNames || !fieldNames.length) return '';
  const fields = fieldNames.map((name) => {
    return `${name}: OrderDirection`;
  });
  return `${fields.join('\n')}`;
}

module.exports = function GraphqlInputOrderBuilder(graphNode) {
  const pub = {
    fieldNames: [],
    result() {
      return `input ${graphNode.capitalizedName()}Order {
        ${buildOrderTypeFields(pub.fieldNames)}
      }`;
    },
  };

  pub.addFieldName = function addFieldName(fieldName) {
    pub.fieldNames.push(fieldName);
  };
  return pub;
};
