const buildGraphqlTypeFields = require('./build-graphql-type-fields.js');

module.exports = function GraphqlInputSearchBuilder(graphNode) {
  const pub = {
    fieldDefs: new Map(),
    result() {
      return `input ${graphNode.capitalizedName()}Search {
        ${buildGraphqlTypeFields(pub.fieldDefs)}
      }`;
    },
  };

  pub.addFieldDef = function addFieldDef(name, graphqlType) {
    pub.fieldDefs.set(name, graphqlType);
  };

  return pub;
};
