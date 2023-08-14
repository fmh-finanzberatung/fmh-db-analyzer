const GraphQL = require('graphql');
const TypeBuilder = require('./builders/type-builder.js');
// const log = require('mk-log');

function buildArgs(node) {

  const typeBuilder = TypeBuilder(node);
  const domesticInputTypes = typeBuilder.domesticTypes('Input');
  const searchInputType = typeBuilder.searchType('Input');
  const excludeInputType = typeBuilder.excludeType('Input');
  const orderInputType = typeBuilder.orderType('Input');
  const rangeInputType = typeBuilder.rangeType('Input');

  const args = {};

  domesticInputTypes.forEach((gqlType, fieldName) => {
    args[fieldName] = {
      type: gqlType,
    };
  });

  searchInputType.one((gqlType) => {
    args['search'] = {
      type: gqlType,
    };
  });

  excludeInputType.one((gqlType) => {
    args['exclude'] = {
      type: gqlType,
    };
  });

  rangeInputType.one((gqlType) => {
    args['range'] = {
      type: gqlType,
    };
  });

  orderInputType.one((gqlType) => {
    args['order'] = {
      type: gqlType,
    };
  });

  return args;
}

function InputArgsStore() {
  const obj = Object.create(
    {
      fetchForNode(node) {
        const key = node.capitalizedName();
        const inputArgs = this.inputArgsMap[key];
        if (inputArgs) {
          return inputArgs;
        }
        const createdArgs = buildArgs(node);
        this.inputArgsMap[key] = createdArgs;
        return createdArgs;
      },
    },
    {
      inputArgsMap: {
        type: Object,
        value: {},
      },
    }
  );
  return obj;
}

module.exports = InputArgsStore;
