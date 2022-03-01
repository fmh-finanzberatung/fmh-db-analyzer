const log = require('mk-log');
const GraphQL = require('graphql');
const CommonGraphqlTypes = require('../graphql/common-types.graphql.js');
const DbStringInputType = new GraphQL.GraphQLInputObjectType({
  name: 'DbStringInput',
  fields: {
    name: {
      type: GraphQL.GraphQLString,
    },
    length: {
      type: GraphQL.GraphQLInt,
    },
  },
});

const DbTextInputType = new GraphQL.GraphQLInputObjectType({
  name: 'DbTextInput',
  fields: {
    name: {
      type: GraphQL.GraphQLString,
    },
    length: {
      type: GraphQL.GraphQLInt,
    },
  },
});

const DbFloatInputType = new GraphQL.GraphQLInputObjectType({
  name: 'DbFloatInput',
  fields: {
    name: {
      type: GraphQL.GraphQLString,
    },
  },
});

const DbDecimalInputType = new GraphQL.GraphQLInputObjectType({
  name: 'DbDecimalInput',
  fields: {
    name: {
      type: GraphQL.GraphQLString,
    },
    maxDigits: {
      type: GraphQL.GraphQLInt,
    },
    rightDigits: {
      type: GraphQL.GraphQLInt,
    },
  },
});

const DbTimestampInputType = new GraphQL.GraphQLInputObjectType({
  name: 'DbTimestampInput',
  fields: {
    name: {
      type: GraphQL.GraphQLString,
    },
  },
});

const DbDateInputType = new GraphQL.GraphQLInputObjectType({
  name: 'DbDateInputType',
  fields: {
    name: {
      type: GraphQL.GraphQLString,
    },
  },
});

const DbDateTimeInputType = new GraphQL.GraphQLInputObjectType({
  name: 'DbDateTimeInputType',
  fields: {
    name: {
      type: GraphQL.GraphQLString,
    },
  },
});

const DbIDInputType = new GraphQL.GraphQLInputObjectType({
  name: 'DbIDInput',
  fields: {
    name: {
      type: GraphQL.GraphQLString,
      defaultValue: 'id',
    },
    idType: {
      type: new GraphQL.GraphQLEnumType({
        name: 'DbIDType',
        values: {
          INT: {
            value: 'INT',
          },
          UUID: {
            value: 'UUID',
          },
        },
      }),
      defaultValue: 'INT',
    },
  },
});

const DbIntegerInputType = new GraphQL.GraphQLInputObjectType({
  name: 'DbIntegerInput',
  fields: {
    name: {
      type: GraphQL.GraphQLString,
    },
    isUnsigned: {
      type: GraphQL.GraphQLBoolean,
      defaultValue: true,
    },
  },
});

const DbInputType = new GraphQL.GraphQLInputObjectType({
  name: 'DbInputType',
  description:
    "Database Input Type: It's a little weird, but theres no other way",
  fields: {
    string: { type: DbStringInputType },
    text: { type: DbTextInputType },
    integer: { type: DbIntegerInputType },
    id: { type: DbIDInputType },
    float: { type: DbFloatInputType },
    decimal: { type: DbDecimalInputType },
    timestamp: { type: DbTimestampInputType },
    date: { type: DbDateInputType },
    dateTime: { type: DbDateTimeInputType },
  },
});

const DbAttributePropertiesType = new GraphQL.GraphQLObjectType({
  name: 'DbAttributeProperties',
  fields: {
    ENGINE: { type: GraphQL.GraphQLString },
    TABLE_CATALOG: { type: GraphQL.GraphQLString },
    TABLE_SCHEMA: { type: GraphQL.GraphQLString },
    TABLE_NAME: { type: GraphQL.GraphQLString },
    COLUMN_DEFAULT: { type: GraphQL.GraphQLString },
    DATA_TYPE: { type: GraphQL.GraphQLBoolean },
    IS_NULLABLE: { type: GraphQL.GraphQLBoolean },
    CHARACTER_MAXIMUM_LENGTH: { type: GraphQL.GraphQLInt },
    CHARACTER_OCTET_LENGTH: { type: GraphQL.GraphQLInt },
    NUMERIC_SCALE: { type: GraphQL.GraphQLInt },
    DATE_TIME_PRECISION: { type: GraphQL.GraphQLInt },
    COLUMN_TYPE: { type: GraphQL.GraphQLString },
    COLUMN_KEY: { type: GraphQL.GraphQLString },
    EXTRA: { type: GraphQL.GraphQLString },
    PRIVILEGES: { type: GraphQL.GraphQLString },
    COLLATION_NAME: { type: GraphQL.GraphQLString },
    COLUMN_COMMENT: { type: GraphQL.GraphQLString },
    IS_GENERATED: { type: GraphQL.GraphQLString },
    GENERATION_EXPRESSION: { type: GraphQL.GraphQLString },
  },
});

module.exports = function dbAdmin({
  journal,
  metaSchemas,
  database,
  query = () => {},
  mutation = () => {},
}) {
  const AttributeType = new GraphQL.GraphQLObjectType({
    name: 'DbAttributeDef',
    fields: {
      name: { type: GraphQL.GraphQLString },
      properties: {
        type: DbAttributePropertiesType,
      },
      // missing information about
      // primary key, uniqe, index, auto increment, foreign key
    },
  });

  const DbTable = new GraphQL.GraphQLObjectType({
    name: 'DbTable',
    fields: () => ({
      name: {
        type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString),
      },
      attributes: {
        type: new GraphQL.GraphQLList(AttributeType),
      },
      error: {
        type: CommonGraphqlTypes.ErrorOutput,
      },
    }),
  });

  const createTableMutation = {
    type: DbTable,
    args: {
      name: {
        type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString),
      },
      attributes: {
        type: new GraphQL.GraphQLNonNull(
          new GraphQL.GraphQLList(new GraphQL.GraphQLNonNull(DbInputType))
        ),
      },
    },
    resolve: async (_root, args, _context, _info) => {
      try {
        log.info('args', args);

        const { name, attributes } = args;

        const fieldsCode = attributes.reduce((accList, attributeItem) => {
          for (const key in attributeItem) {
            const attrDef = attributeItem[key];
            if (key === 'id') {
              accList.push('id INT AUTO_INCREMENT PRIMARY KEY');
            } else if (key === 'string') {
              accList.push(`${attrDef.name} VARCHAR(255)`);
            } else if (key === 'text') {
              accList.push(`${attrDef.name} TEXT`);
            } else if (key === 'integer') {
              accList.push(`${attrDef.name} INT`);
            } else if (key === 'float') {
              accList.push(`${attrDef.name} FLOAT`);
            } else if (key === 'double') {
              accList.push(`${attrDef.name} DOUBLE`);
            }
          }

          return accList;
        }, []);

        log.info('fieldsCode', fieldsCode);

        log.info('name      ', name);
        log.info('attributes', attributes);

        const SQLCreate = `CREATE TABLE IF NOT EXISTS ${name} (
            ${fieldsCode.join(', ')}
           );`;
        log.info('SQLCreate', SQLCreate);
        const createdTable = await database.knex.raw(SQLCreate);
        log.info('createdTable', createdTable);
        const SQLQuery = `SELECT * FROM ${name}`;

        const table = await database.knex.raw(SQLQuery);

        log.info('table', table);

        return {
          name: name,
          attributes: attributes,
        };
      } catch (error) {
        log.error(error);
        return { error };
      }
    },
  };

  const changeTableFieldsMutation = {
    type: DbTable,
    args: {
      name: {
        type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString),
      },
      attributes: {
        type: new GraphQL.GraphQLNonNull(
          new GraphQL.GraphQLList(new GraphQL.GraphQLNonNull(DbInputType))
        ),
      },
    },
    resolve: async (_root, args, _context, _info) => {
      try {
        const { name, attributes } = args;
        //const table = await db.knex.createTableIfNoneExists(names);
        log.info('attributes', attributes);

        const alteredFields = attributes.reduce((acc, item) => {
          for (const key in item) {
            const attrDef = item[key];
            if (key === 'id') {
              acc.push('id INT AUTO_INCREMENT PRIMARY KEY');
            } else if (key === 'string') {
              acc.push(`${attrDef.name} VARCHAR(255)`);
            } else if (key === 'text') {
              acc.push(`${attrDef.name} TEXT`);
            } else if (key === 'integer') {
              acc.push(`${attrDef.name} INT`);
            } else if (key === 'float') {
              acc.push(`${attrDef.name} FLOAT`);
            } else if (key === 'double') {
              acc.push(`${attrDef.name} DOUBLE`);
            }
          }
          return acc;
        }, []);

        const joinedFields = alteredFields
          .map((f) => `MODIFY COLUMN ${f}`)
          .join(',');

        const SQLCode = `ALTER TABLE ${name} ${joinedFields};`;
        const result = await database.knex.raw(SQLCode);
        log.info('name         ', name);
        log.info('alteredFields', alteredFields);

        log.info('result', result);

        return {
          name: name,
          attributes: attributes,
        };
      } catch (error) {
        log.error(error);
        return { error };
      }
    },
  };

  const deleteTableFieldsMutation = {
    type: DbTable,
    args: {
      name: {
        type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString),
      },
      attributes: {
        type: new GraphQL.GraphQLNonNull(
          new GraphQL.GraphQLList(
            new GraphQL.GraphQLNonNull(GraphQL.GraphQLString)
          )
        ),
      },
    },
    resolve: async (_root, args, _context, _info) => {
      try {
        const { name, attributes } = args;
        //const table = await db.knex.createTableIfNoneExists(names);

        log.info('name      ', name);
        log.info('attributes', attributes);

        return {
          name: name,
          attributes: attributes,
        };
      } catch (error) {
        log.error(error);
        return { error };
      }
    },
  };

  const renameTableFieldsMutation = {
    type: DbTable,
    args: {
      name: {
        type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString),
      },
      attributes: {
        type: new GraphQL.GraphQLNonNull(
          new GraphQL.GraphQLList(
            new GraphQL.GraphQLNonNull(GraphQL.GraphQLString)
          )
        ),
      },
    },
    resolve: async (_root, args, _context, _info) => {
      try {
        const { name, attributes } = args;
        //const table = await db.knex.createTableIfNoneExists(names);

        log.info('name      ', name);
        log.info('attributes', attributes);

        return {
          name: name,
          attributes: attributes,
        };
      } catch (error) {
        log.error(error);
        return { error };
      }
    },
  };

  const addTableFieldsMutation = {
    type: DbTable,
    args: {
      name: {
        type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString),
      },
      attributes: {
        type: new GraphQL.GraphQLNonNull(
          new GraphQL.GraphQLList(new GraphQL.GraphQLNonNull(DbInputType))
        ),
      },
    },
    resolve: async (_root, args, _context, _info) => {
      try {
        const { name, attributes } = args;
        //const table = await db.knex.createTableIfNoneExists(names);

        log.info('name      ', name);
        log.info('attributes', attributes);

        return {
          name: name,
          attributes: attributes,
        };
      } catch (error) {
        log.error(error);
        return { error };
      }
    },
  };

  const renameTableMutation = {
    type: DbTable,
    args: {
      name: {
        type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString),
      },
      newName: {
        type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString),
      },
    },
    resolve: async (_root, args, _context, _info) => {
      try {
        const { name, newName } = args;
        const SQLRename = `RENAME TABLE ${name} TO ${newName};`;
        const result = await database.knex.raw(SQLRename);

        log.info('result      ', result);

        return {
          name: name,
        };
      } catch (error) {
        log.error(error);
        return { error };
      }
    },
  };

  const deleteTableMutation = {
    type: DbTable,
    args: {
      name: {
        type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString),
      },
    },
    resolve: async (_root, args, _context, _info) => {
      try {
        const { name } = args;
        //const table = await db.knex.createTableIfNoneExists(names);

        log.info('name      ', name);

        const SQLDelete = `DROP TABLE ${name};`;
        const table = await database.knex.raw(SQLDelete);

        log.info('table', table);

        return {
          name: name,
        };
      } catch (error) {
        log.error(error);
        return { error };
      }
    },
  };

  const tablesQuery = {
    type: new GraphQL.GraphQLObjectType({
      name: 'DbSchema',
      fields: () => {
        return {
          name: {
            type: GraphQL.GraphQLString,
          },
          tables: {
            type: new GraphQL.GraphQLList(DbTable),
          },
        };
      },
    }),
    resolve: () => {
      // resolving to

      const tables = Array.from(journal).reduce((list, [_, value]) => {
        //log.info('value', value.attributes);

        const attributes = Array.from(value.attributes).reduce(
          (attrs, [attrKey, attrProperties]) => {
            attrs.push({
              name: attrKey,
              properties: Object.fromEntries(attrProperties),
            });
            return attrs;
          },
          []
        );

        //log.info('attributes', attributes);

        list.push({
          name: value.tableName,
          attributes,
        });
        return list;
      }, []);

      return {
        name: metaSchemas[0][0].TABLE_SCHEMA,
        tables,
      };
    },
  };

  query('dbSchema', tablesQuery);
  mutation('dbCreateTable', createTableMutation);
  mutation('dbDeleteTable', deleteTableMutation);
  mutation('dbRenameTable', renameTableMutation);
  mutation('dbAddTableFields', addTableFieldsMutation);
  mutation('dbChangeTableFields', changeTableFieldsMutation);
  mutation('dbDeleteTableFields', deleteTableFieldsMutation);
  mutation('dbRenameTableFields', renameTableFieldsMutation);
};
