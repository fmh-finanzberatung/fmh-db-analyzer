const graphql = require('graphql');

const { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLID, GraphQLInt } =
  graphql;

const mysqlTypeMap = new Map();
mysqlTypeMap.set('int', GraphQLInt);
mysqlTypeMap.set('tinyint', GraphQLInt);
mysqlTypeMap.set('varchar', GraphQLString);
mysqlTypeMap.set('text', GraphQLString);
mysqlTypeMap.set('datetime', GraphQLString);
mysqlTypeMap.set('timestamp', GraphQLString);

const mongoTypeMap = new Map();
mongoTypeMap.set('ObjectId', GraphQLID);

const dbMaps = new Map([
  ['mysql', mysqlTypeMap],
  ['mongo', mongoTypeMap],
]);

/**
 * module.exports  DbToGraphqlTypeMaps
 *
 * @param {String} db - mysql, mongo
 */
module.exports = function DbToGraphqlTypeMaps(db) {
  const dbMap = dbMaps.get(db);

  if (!dbMap) {
    throw new Error(
      `Can't find mapping for database "${db}". Must be one of: ${Array.from(
        dbMaps.keys()
      ).join(', ')}.`
    );
  }

  return {
    gqlType(dbType) {
      const qlType = dbMap.get(dbType);
      if (!qlType)
        return `Can not find matching GraphQL type for database Type "${dbType}"`;
      return qlType;
    },
  };
};
