const GraphQL = require('graphql');
// const log = require('mk-log');

function TypesStore() {
  const obj = Object.create(
    {
      fetchType(key) {
        const val = this.typesMap[key];
        if (val) {
          return val;
        }
        const typeDef = this.typesDefMap[key];
        const createdType = new GraphQL.GraphQLObjectType(typeDef);

        this.typesMap[key] = createdType;
        return createdType;
      },
      addTypeDef(key, typeDef) {
        this.typesDefMap[key] = typeDef;
      },
    },
    {
      typesMap: {
        type: Object,
        value: {},
      },
      typesDefMap: {
        type: Object,
        value: {},
      },
    }
  );
  return obj;
}

module.exports = TypesStore;
