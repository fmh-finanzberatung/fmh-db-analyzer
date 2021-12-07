const tap = require('../../utils/tap.js');
const CommonGraphqlTypes = require('../../graphql/common-types.graphql');
const GraphQL = require('graphql');
const log = require('mk-log');

function buildNodeInputArgs(graphNode) {
  const nodeArgs = {};
  const argsReducer = (nodeArgsAcc, [key, value]) => {
    const dataType = value.get('DATA_TYPE');
    const gqlType = graphNode.dbToGraphqlTypesMap.gqlInputType(dataType);
    nodeArgsAcc[key] = { type: gqlType };
    return nodeArgsAcc;
  };
  Array.from(graphNode.domesticAttributes()).reduce(argsReducer, nodeArgs);

  return nodeArgs;
}

module.exports = function GraphqlTypeBuilder(graphNode) {
  const pub = {
    // added by method addParamFieldDef
    paramFieldDefs: new Map(),
    // added by method addInputFieldDef
    inputFieldDefs: new Map(),
    // added by method addReturnFieldDef
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

  function buildNodeOutputFields() {
    const nodeArgs = {};
    const argsReducer = (nodeArgsAcc, [key, value]) => {
      const dataType = value.get('DATA_TYPE');

      nodeArgsAcc[key] = {
        type: graphNode.dbToGraphqlTypesMap.gqlType(dataType),
      };
      return nodeArgsAcc;
    };
    Array.from(graphNode.domesticAttributes()).reduce(argsReducer, nodeArgs);
    return nodeArgs;
  }

  const NodeOutput = new GraphQL.GraphQLObjectType({
    name: `${graphNode.capitalizedName()}Output`,
    fields: () =>
      Object.assign({}, buildNodeOutputFields(), {
        error: {
          type: CommonGraphqlTypes.ErrorOutput,
        },
      }),
  });

  log.info(NodeOutput);

  function deleteItemInput({
    _injectTypes,
    _injectParams,
    attachToSchema,
  } = {}) {
    attachToSchema(`delete${graphNode.capitalizedName()}`, {
      type: NodeOutput,
      args: buildNodeInputArgs(graphNode),
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
      args: buildNodeInputArgs(graphNode),
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
      args: buildNodeInputArgs(graphNode),
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
      args: buildNodeInputArgs(graphNode),
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
      args: buildNodeInputArgs(graphNode),
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
      args: buildNodeInputArgs(graphNode),
      resolve: (_obj, _args, _context, _info) => {
        return {
          error: {
            message: 'Not Implemented',
          },
        };
      },
    });
  }

  function queryItemInput({
    _injectTypes,
    _injectParams,
    attachToSchema,
  } = {}) {
    attachToSchema(`${graphNode.name()}`, {
      name: `${graphNode.capitalizedName()}`,
      type: NodeOutput,
      args: buildNodeInputArgs(graphNode),
      resolve: (_obj, _args, _context, _info) => {
        return {
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
      args: buildNodeInputArgs(graphNode),
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
