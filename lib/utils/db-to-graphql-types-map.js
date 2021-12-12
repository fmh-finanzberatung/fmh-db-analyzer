const graphql = require('graphql');
const log = require('mk-log');
const { GraphQLString, GraphQLBoolean, GraphQLID, GraphQLInt, GraphQLFloat } =
  graphql;
const CommonGraphqlTypes = require('../graphql/common-types.graphql.js');

const mysqlTypeMap = new Map();
mysqlTypeMap.set('int', { outputType: GraphQLInt, inputType: GraphQLInt });
mysqlTypeMap.set('tinyint', {
  outputType: GraphQLBoolean,
  inputType: GraphQLBoolean,
});
mysqlTypeMap.set('decimal', {
  outputType: GraphQLFloat,
  inputType: GraphQLFloat,
});
mysqlTypeMap.set('double', {
  outputType: GraphQLFloat,
  inputType: GraphQLFloat,
});
mysqlTypeMap.set('float', {
  outputType: GraphQLFloat,
  inputType: GraphQLFloat,
});
mysqlTypeMap.set('varchar', {
  outputType: GraphQLString,
  inputType: GraphQLString,
});
mysqlTypeMap.set('text', {
  outputType: GraphQLString,
  inputType: GraphQLString,
});
mysqlTypeMap.set('date', {
  outputType: CommonGraphqlTypes.DateOutput,
  inputType: CommonGraphqlTypes.DateInput,
});
mysqlTypeMap.set('datetime', {
  outputType: CommonGraphqlTypes.DateTimeOutput,
  inputType: CommonGraphqlTypes.DateTimeInput,
});
mysqlTypeMap.set('timestamp', {
  outputType: CommonGraphqlTypes.DateTimeOutput,
  inputType: CommonGraphqlTypes.DateTimeInput,
});

const mongoTypeMap = new Map();
mongoTypeMap.set('ObjectId', { outputType: GraphQLID, inputType: GraphQLID });

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
  if (!db) {
    throw new Error(`Database name must be provided, instead got "${db}".`);
  }

  const dbMap = dbMaps.get(db);

  if (!dbMap) {
    throw new Error(
      `Can't find mapping for database "${db}". Must be one of: ${Array.from(
        dbMaps.keys()
      ).join(', ')}.`
    );
  }

  return {
    gqlOutputType(dbType) {
      const qlType = dbMap.get(dbType);
      if (!qlType) {
        throw new Error(
          `Can not find matching GraphQL type for database Type "${dbType}"`
        );
      }
      return qlType.outputType;
    },
    gqlInputType(dbType) {
      const qlType = dbMap.get(dbType);
      if (!qlType) {
        throw new Error(
          `Can not find matching GraphQL type for database Type "${dbType}"`
        );
      }
      return qlType.inputType;
    },
  };
};
