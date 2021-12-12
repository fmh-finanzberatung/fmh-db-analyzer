const GraphQL = require('graphql'); const CommonGraphqlTypes =
  require('./graphql/common-types.graphql.js');

// geql input field object with key: fieldName and value: gqlType
function buildOrderTypeFields(gqlInputFields) { if (!fieldNames ||
  !fieldNames.length) return '';
  const fields = fieldNames.map((name) => {
    return `${name}: OrderDirection`;
  });
  return `${fields.join('\n')}`;
}

const reducer = (obj, [attr, fieldName]) => {
   obj[fieldName] = CommonGraphQlTypes.OrderDirection;
};


module.exports = function GraphqlInputOrderBuilder(graphNode) {

  return new GraphQLInputObjectType {
    name: `${graphNode.name}OrderInput`,
    fields: () => graphNode.domesticAttributes.reduce({}, reducer)
  }; 

};
