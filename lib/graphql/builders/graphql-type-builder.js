const tap = require('../../utils/tap.js');
const CommonGraphqlTypes = require('../../graphql/common-types.graphql.js');
const GraphQL = require('graphql');
const log = require('mk-log');

//const ResolversObjectBuilder = require('../lib/utils/resolvers-object-builder.js');

function mapGraphqlTypeToFieldKey(graphNode, gqlTypeName = 'Input') {
  const nodeArgs = {};
  const argsReducer = (nodeArgsAcc, [key, value]) => {
    const dataType = value.get('DATA_TYPE');

    const gqlType =
      graphNode.dbToGraphqlTypesMap[`gql${gqlTypeName}Type`](dataType);

    nodeArgsAcc[key] = gqlType;
    return nodeArgsAcc;
  };
  const result = Array.from(graphNode.domesticAttributes()).reduce(
    argsReducer,
    nodeArgs
  );

  return result;
}

function buildOrderInputFields(graphNode) {
  const fieldTypeObj = mapGraphqlTypeToFieldKey(graphNode, 'Input');
  const fields = {};

  const reducer = (fieldsAcc, key) => {
    fieldsAcc[key] = {
      type: CommonGraphqlTypes.OrderDirectionInput,
    };
    return fieldsAcc;
  };

  const inputFields = Object.keys(fieldTypeObj).reduce(reducer, fields);

  const orderInput = new GraphQL.GraphQLInputObjectType({
    name: `${graphNode.capitalizedName()}OrderInput`,
    fields: inputFields,
  });

  return orderInput;
}

function buildSearchInputFields(graphNode) {
  const fieldTypeObj = mapGraphqlTypeToFieldKey(graphNode, 'Input');
  const fields = {};

  const reducer = (fieldsAcc, key) => {
    fieldsAcc[key] = {
      type: fieldTypeObj[key],
    };
    return fieldsAcc;
  };

  const inputFields = Object.keys(fieldTypeObj).reduce(reducer, fields);

  const orderInput = new GraphQL.GraphQLInputObjectType({
    name: `${graphNode.capitalizedName()}SearchInput`,
    fields: inputFields,
  });

  return orderInput;
}

function buildExcludeInputFields(graphNode) {
  const fieldTypeObj = mapGraphqlTypeToFieldKey(graphNode, 'Input');
  const fields = {};

  const reducer = (fieldsAcc, key) => {
    fieldsAcc[key] = {
      type: fieldTypeObj[key],
    };
    return fieldsAcc;
  };

  const inputFields = Object.keys(fieldTypeObj).reduce(reducer, fields);

  const orderInput = new GraphQL.GraphQLInputObjectType({
    name: `${graphNode.capitalizedName()}ExcludeInput`,
    fields: inputFields,
  });

  return orderInput;
}

function buildRangeInputFields(graphNode) {
  const fieldTypeObj = mapGraphqlTypeToFieldKey(graphNode, 'Input');
  const fields = {};

  const reducer = (fieldsAcc, key) => {
    const inputType = fieldTypeObj[key];
    const rangeInputTypeName = `${inputType}RangeInput`;
    const rangeInputType = CommonGraphqlTypes[rangeInputTypeName];
    fieldsAcc[key] = {
      type: rangeInputType,
    };
    return fieldsAcc;
  };

  const inputFields = Object.keys(fieldTypeObj).reduce(reducer, fields);
  const rangeInput = new GraphQL.GraphQLInputObjectType({
    name: `${graphNode.capitalizedName()}RangeInput`,
    fields: inputFields,
  });

  return rangeInput;
}

function buildScalarInputFields(graphNode) {
  const fieldTypeObj = mapGraphqlTypeToFieldKey(graphNode, 'Input');
  const fields = {};
  const reducer = (fieldsAcc, key) => {
    fieldsAcc[key] = {
      type: fieldTypeObj[key],
    };
    return fieldsAcc;
  };
  const inputFields = Object.keys(fieldTypeObj).reduce(reducer, fields);
  return inputFields;
}

function buildScalarOutputFields(graphNode) {
  const fieldTypeObj = mapGraphqlTypeToFieldKey(graphNode, 'Output');
  const fields = {};
  const reducer = (fieldsAcc, key) => {
    fieldsAcc[key] = {
      type: fieldTypeObj[key],
    };
    return fieldsAcc;
  };
  const outputFields = Object.keys(fieldTypeObj).reduce(reducer, fields);
  return outputFields;
}

function buildChildOutput(graphNode) {
  const ScalarOutputFields = buildScalarOutputFields(graphNode);
  //const TreeOutputFields = buildTreeOutputFields(graphNode);
  const NodeOutput = new GraphQL.GraphQLObjectType({
    name: `${graphNode.capitalizedName()}ChildOutput`,
    fields: () =>
      Object.assign(
        {},
        ScalarOutputFields,
        //TreeOutputFields,
        {
          error: {
            type: CommonGraphqlTypes.ErrorOutput,
          },
        }
      ),
  });
  return NodeOutput;
}

function buildParentOutput(graphNode) {
  const ScalarOutputFields = buildScalarOutputFields(graphNode);
  //const TreeOutputFields = buildTreeOutputFields(graphNode);
  const NodeOutput = new GraphQL.GraphQLObjectType({
    name: `${graphNode.capitalizedName()}ParentOutput`,
    fields: () =>
      Object.assign(
        {},
        ScalarOutputFields,
        //TreeOutputFields,
        {
          error: {
            type: CommonGraphqlTypes.ErrorOutput,
          },
        }
      ),
  });
  return NodeOutput;
}

function buildTreeOutputFields(graphNode) {
  if (!graphNode.treeEdges().length) return {};

  const childOutputType = buildChildOutput(graphNode);
  const parentOutputType = buildParentOutput(graphNode);

  const treeOutputFields = {
    children: {
      type: new GraphQL.GraphQLObjectType({
        name: `${graphNode.capitalizedName()}Children`,
        fields: () => {
          return {
            docs: {
              type: new GraphQL.GraphQLList(childOutputType),
            },
            pagination: {
              type: CommonGraphqlTypes.PaginationOutput,
            },
          };
        },
      }),
    },
    parent: {
      type: parentOutputType,
    },
  };
  return treeOutputFields;
}

function buildNodeOutput(graphNode) {
  const ScalarOutputFields = buildScalarOutputFields(graphNode);
  const TreeOutputFields = buildTreeOutputFields(graphNode);
  const NodeOutput = new GraphQL.GraphQLObjectType({
    name: `${graphNode.capitalizedName()}Output`,
    fields: () =>
      Object.assign({}, ScalarOutputFields, TreeOutputFields, {
        error: {
          type: CommonGraphqlTypes.ErrorOutput,
        },
      }),
  });
  return NodeOutput;
}

module.exports = function GraphqlTypeBuilder(graphNode) {
  const pub = {
    // items added by method addParamFieldDef
    paramFieldDefs: new Map(),
    // items added by method addInputFieldDef
    inputFieldDefs: new Map(),
    // items added by method addReturnFieldDef
    returnFieldDefs: new Map(),
    tap,
    createItemInput,
    createListInput,
    deleteItemInput,
    deleteListInput,
    queryItemInput,
    queryListInput,
    updateItemInput,
    updateListInput,
  };

  const OrderInputFields = buildOrderInputFields(graphNode);
  const ScalarInputFields = buildScalarInputFields(graphNode);
  const RangeInputFields = buildRangeInputFields(graphNode);
  const SearchInputFields = buildSearchInputFields(graphNode);
  const ExcludeInputFields = buildExcludeInputFields(graphNode);

  //const ScalarOutputFields = buildScalarOutputFields(graphNode);

  //const TreeOutputFields = buildTreeOutputFields(graphNode);

  const NodeOutput = buildNodeOutput(graphNode);

  log.info('NodeOutput', NodeOutput);

  function queryItemInput({
    _injectTypes,
    _injectParams,
    attachToSchema,
  } = {}) {
    attachToSchema(`${graphNode.name()}`, {
      name: `${graphNode.name()}`,
      type: NodeOutput,
      args: Object.assign({}, ScalarInputFields, {
        order: {
          type: OrderInputFields,
        },
        range: {
          type: RangeInputFields,
        },
        search: {
          type: SearchInputFields,
        },
        exclude: {
          type: ExcludeInputFields,
        },
      }),
      resolve: (_obj, _args, _context, _info) => {
        return {
          children: {
            docs: [{ id: 1 }],
            pagination: {
              total: 1,
              pageSize: 1,
            },
          },
          error: {
            message: 'Not Implemented',
          },
        };
      },
    });
  }

  function queryListInput({
    _injectTypes,
    _injectParams,
    attachToSchema,
  } = {}) {
    attachToSchema(`${graphNode.name()}List`, {
      name: `${graphNode.capitalizedName()}List`,
      type: NodeOutput,
      args: Object.assign({}, ScalarInputFields, {
        order: {
          type: OrderInputFields,
        },
        range: {
          type: RangeInputFields,
        },
        search: {
          type: SearchInputFields,
        },
        exclude: {
          type: ExcludeInputFields,
        },
      }),
      resolve: (_obj, _args, _context, _info) => {
        return {
          error: {
            message: 'Not Implemented',
          },
        };
      },
    });
  }

  function deleteItemInput({
    _injectTypes,
    _injectParams,
    attachToSchema,
  } = {}) {
    attachToSchema(`delete${graphNode.capitalizedName()}`, {
      type: NodeOutput,
      args: buildScalarInputFields(graphNode),
      resolve: (_obj, _args, _context, _info) => {
        return {
          error: {
            message: 'Not Implemented',
          },
        };
      },
    });
  }

  function deleteListInput({
    _injectTypes,
    _injectParams,
    attachToSchema,
  } = {}) {
    attachToSchema(`delete${graphNode.capitalizedName()}List`, {
      type: NodeOutput,
      args: buildScalarInputFields(graphNode),
      resolve: (_obj, _args, _context, _info) => {
        return {
          error: {
            message: 'Not Implemented',
          },
        };
      },
    });
  }

  function createItemInput({
    _injectTypes,
    _injectParams,
    attachToSchema,
  } = {}) {
    attachToSchema(`create${graphNode.capitalizedName()}`, {
      type: NodeOutput,
      args: buildScalarInputFields(graphNode),
      resolve: (_obj, _args, _context, _info) => {
        return {
          error: {
            message: 'Not Implemented',
          },
        };
      },
    });
  }

  function createListInput({
    _injectTypes,
    _injectParams,
    attachToSchema,
  } = {}) {
    attachToSchema(`create${graphNode.capitalizedName()}List`, {
      type: NodeOutput,
      args: buildScalarInputFields(graphNode),
      resolve: (_obj, _args, _context, _info) => {
        return {
          error: {
            message: 'Not Implemented',
          },
        };
      },
    });
  }

  function updateItemInput({
    _injectTypes,
    _injectParams,
    attachToSchema,
  } = {}) {
    attachToSchema(`update${graphNode.capitalizedName()}`, {
      type: NodeOutput,
      args: buildScalarInputFields(graphNode),
      resolve: (_obj, _args, _context, _info) => {
        return {
          error: {
            message: 'Not Implemented',
          },
        };
      },
    });
  }

  function updateListInput({
    _injectTypes,
    _injectParams,
    attachToSchema,
  } = {}) {
    attachToSchema(`update${graphNode.capitalizedName()}List`, {
      type: NodeOutput,
      args: buildScalarInputFields(graphNode),
      resolve: (_obj, _args, _context, _info) => {
        return {
          error: {
            message: 'Not Implemented',
          },
        };
      },
    });
  }

  pub.addParamFieldDef = function addParamFieldDef(name, graphqlType) {
    pub.paramFieldDefs.set(name, graphqlType);
  };

  pub.addInputFieldDef = function addInputFieldDef(name, graphqlType) {
    pub.inputFieldDefs.set(name, graphqlType);
  };

  pub.addReturnFieldDef = function addReturnFieldDef(name, graphqlType) {
    pub.returnFieldDefs.set(name, graphqlType);
  };

  return pub;
};
