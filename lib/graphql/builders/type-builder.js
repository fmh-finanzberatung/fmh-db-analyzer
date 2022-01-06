// const log = require('mk-log');
const GraphQL = require('graphql');
const CommonGraphqlTypes = require('../common-types.graphql.js');

function buildDomesticTypes(graphNode, gqlTypeName = 'Input') {
  const domesticTypesReducer = (nodeArgsAcc, [key, value]) => {
    const dataType = value.get('DATA_TYPE');
    const gqlType =
      graphNode.dbToGraphqlTypesMap[`gql${gqlTypeName}Type`](dataType);

    nodeArgsAcc.set(key, gqlType);
    return nodeArgsAcc;
  };

  const resultTypes = Array.from(graphNode.domesticAttributes()).reduce(
    domesticTypesReducer,
    new Map()
  );

  return resultTypes;
}

function buildSearchInputType(graphNode, gqlTypeName = 'Input') {
  const name = `${graphNode.capitalizedName()}Search${gqlTypeName}`;
  const searchTypesReducer = (nodeArgsAcc, [varName, gqlType]) => {
    nodeArgsAcc[`${varName}`] = {
      type: gqlType,
      description: `Search for ${varName} in ${graphNode.capitalizedName()}`,
    };
    return nodeArgsAcc;
  };
  const domesticTypes = buildDomesticTypes(graphNode, gqlTypeName);

  const searchTypes = Array.from(domesticTypes).reduce(searchTypesReducer, {});

  const searchType = new GraphQL.GraphQLInputObjectType({
    name,
    description: `Search Input for ${graphNode.capitalizedName()}`,
    fields: searchTypes,
  });

  return {
    one(closFn) {
      closFn(searchType);
    },
  };
}

function buildExcludeInputType(graphNode, gqlTypeName = 'Input') {
  const name = `${graphNode.capitalizedName()}Exclude${gqlTypeName}`;
  const searchTypesReducer = (nodeArgsAcc, [varName, gqlType]) => {
    nodeArgsAcc[`${varName}`] = {
      type: gqlType,
      description: `Exclude ${varName} in ${graphNode.capitalizedName()}`,
    };
    return nodeArgsAcc;
  };
  const domesticTypes = buildDomesticTypes(graphNode, gqlTypeName);

  const searchTypes = Array.from(domesticTypes).reduce(searchTypesReducer, {});

  const searchType = new GraphQL.GraphQLInputObjectType({
    name,
    description: `Search Input for ${graphNode.capitalizedName()}`,
    fields: searchTypes,
  });

  return {
    one(closFn) {
      closFn(searchType);
    },
  };
}

function buildOrderInputType(graphNode, gqlTypeName = 'Input') {
  const name = `${graphNode.capitalizedName()}Order${gqlTypeName}`;

  const orderTypesReducer = (nodeArgsAcc, [varName, _gqlType]) => {
    nodeArgsAcc[`${varName}`] = {
      type: CommonGraphqlTypes.OrderDirectionInput,
      description: `Order for ${varName} in ${graphNode.capitalizedName()}`,
    };
    return nodeArgsAcc;
  };
  const domesticTypes = buildDomesticTypes(graphNode, gqlTypeName);

  const orderTypes = Array.from(domesticTypes).reduce(orderTypesReducer, {});

  const orderType = new GraphQL.GraphQLInputObjectType({
    name,
    description: `Order Input for ${graphNode.capitalizedName()}`,
    fields: orderTypes,
  });

  return {
    one(closFn) {
      closFn(orderType);
    },
  };
}

function buildRangeInputType(graphNode, gqlTypeName = 'Input') {
  const name = `${graphNode.capitalizedName()}Range${gqlTypeName}`;
  const rangeTypesReducer = (nodeArgsAcc, [varName, gqlType]) => {
    nodeArgsAcc[`${varName}`] = {
      type: CommonGraphqlTypes[`${gqlType}Range${gqlTypeName}`],
      description: `Search for ${varName} in ${graphNode.capitalizedName()}`,
    };
    return nodeArgsAcc;
  };
  const domesticTypes = buildDomesticTypes(graphNode, gqlTypeName);

  const rangeTypes = Array.from(domesticTypes).reduce(rangeTypesReducer, {});

  const rangeType = new GraphQL.GraphQLInputObjectType({
    name,
    description: `Range Input for ${graphNode.capitalizedName()}`,
    fields: rangeTypes,
  });

  return {
    one(closFn) {
      closFn(rangeType);
    },
  };
}

module.exports = function TypeBuilder(graphNode) {
  return {
    domesticTypes: function domesticTypes(gqlTypeName = 'Input') {
      return buildDomesticTypes(graphNode, gqlTypeName);
    },
    searchType: function searchType(gqlTypeName = 'Input') {
      return buildSearchInputType(graphNode, gqlTypeName);
    },
    excludeType: function searchType(gqlTypeName = 'Input') {
      return buildExcludeInputType(graphNode, gqlTypeName);
    },
    orderType: function orderType(gqlTypeName = 'Input') {
      return buildOrderInputType(graphNode, gqlTypeName);
    },
    rangeType: function rangeType(gqlTypeName = 'Input') {
      return buildRangeInputType(graphNode, gqlTypeName);
    },
  };
};