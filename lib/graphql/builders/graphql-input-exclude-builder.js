const buildGraphqlTypeFields = require('./build-graphql-type-fields.js');

module.exports = function GraphqlInputExcludeBuilder(graphNode) {
  const pub = {
    fieldDefs: new Map(),
    result() {
      return `input ${graphNode.capitalizedName()}Exclude {
        ${buildGraphqlTypeFields(pub.fieldDefs)}
      }`;
    },
  };

  pub.addFieldDef = function addFieldDef(name, graphqlType) {
    pub.fieldDefs.set(name, graphqlType);
  };

  return pub;
};
