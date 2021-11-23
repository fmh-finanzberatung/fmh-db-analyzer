const graphql = require('graphql');

const { GraphQLString, GraphQLBoolean, GraphQLID, GraphQLInt, GraphQLFloat } =
  graphql;

const mysqlTypeMap = new Map();
mysqlTypeMap.set('int', { type: GraphQLInt, inputType: GraphQLInt });
mysqlTypeMap.set('tinyint', {
  type: GraphQLBoolean,
  inputType: GraphQLBoolean,
});

mysqlTypeMap.set('decimal', { type: GraphQLFloat, inputType: GraphQLFloat });
mysqlTypeMap.set('double', { type: GraphQLFloat, inputType: GraphQLFloat });
mysqlTypeMap.set('float', { type: GraphQLFloat, inputType: GraphQLFloat });
mysqlTypeMap.set('varchar', { type: GraphQLString, inputType: GraphQLString });
mysqlTypeMap.set('text', { type: GraphQLString, inputType: GraphQLString });
mysqlTypeMap.set('date', { type: 'Date', inputType: 'DateInput' });
mysqlTypeMap.set('datetime', { type: 'DateTime', inputType: 'DateTimeInput' });
mysqlTypeMap.set('timestamp', { type: 'DateTime', inputType: 'DateTimeInput' });

const mongoTypeMap = new Map();
mongoTypeMap.set('ObjectId', { type: GraphQLID, inputType: GraphQLID });

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
      return qlType.type;
    },
    gqlInputType(dbType) {
      const qlType = dbMap.get(dbType);
      if (!qlType)
        return `Can not find matching GraphQL type for database Type "${dbType}"`;
      return qlType.inputType;
    },
  };
};
