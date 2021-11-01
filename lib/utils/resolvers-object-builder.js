const _log = require('mk-log');

module.exports = function ResolversObjectBuilder() {
  const pub = {
    resolvers: {
      Mutation: {},
      Query: {},
    },
    addMutationResolver(fieldName, resolverFunction) {
      pub.resolvers.Mutation[fieldName] = resolverFunction;
    },
    addQueryResolver(fieldName, resolverFunction) {
      pub.resolvers.Query[fieldName] = resolverFunction;
    },
    addEnumResolver(typeName, resolverObject) {
      if (!pub.resolvers[typeName]) {
        pub.resolvers[typeName] = {};
      }
      pub.resolvers[typeName] = resolverObject;
    },
    addTypeResolver(typeName, fieldName, resolverFunction) {
      if (!pub.resolvers[typeName]) {
        pub.resolvers[typeName] = {};
      }
      pub.resolvers[typeName][fieldName] = resolverFunction;
    },
  };

  return pub;
};
