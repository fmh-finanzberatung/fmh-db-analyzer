const GraphQL = require('graphql');
const CommonGraphqlTypes = require('./graphl/common-graphql-types');

function buildOrderTypeFields(fieldNames) {
  if (!fieldNames || !fieldNames.length) return '';
  const fields = fieldNames.map((name) => {
    return `${name}: OrderDirection`;
  });
  return `${fields.join('\n')}`;
}

function reducer = (obj, [attr, fieldName]) => {
   obj[fieldName] = CommonGraphQlTypes.OrderDirection;
};


module.exports = function GraphqlInputOrderBuilder(graphNode) {

  return new GraphQLInputObjectType {
    name: `${graphNode.name}OrderInput`,
    fields: () => graphNode.domesticAttributes.reduce({}, reducer)
  }; 

};
