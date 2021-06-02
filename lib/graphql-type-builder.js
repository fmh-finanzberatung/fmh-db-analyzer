//const tap = require('./utils/tap.js');
//const log = require('mk-log');
const buildGraphqlTypeFields = require('./build-graphql-type-fields.js');

module.exports = function GraphqlTypeBuilder(graphNode) {
  const pub = {
    paramFieldDefs: new Map(),
    inputFieldDefs: new Map(),
    returnFieldDefs: new Map(),
    //tap,
    singleType,
    listType,
    singleQuery,
    listQuery,
  };

  function singleType({ injectTypes, injectParams } = {}) {
    let injectedParams = '';
    let injectedTypes = '';

    if (injectParams) {
      injectedParams = injectParams();
    }
    if (injectTypes) {
      injectedTypes = injectTypes();
    }
    return `type ${graphNode.capitalizedName()} ${injectedParams} {
      ${buildGraphqlTypeFields(pub.paramFieldDefs)}
      ${buildGraphqlTypeFields(pub.returnFieldDefs)}
      ${injectedTypes} 
    }`;
  }

  function listType({ injectParams, injectTypes }) {
    let injectedParams = '';
    let injectedTypes = '';

    if (injectParams) {
      injectedParams = injectParams();
    }
    if (injectTypes) {
      injectedTypes = injectTypes();
    }
    return `type ${graphNode.capitalizedName()}List ${injectedParams} {
      docs: [${graphNode.capitalizedName()}] 
      ${injectedTypes} 
    }`;
  }

  function singleQuery({ injectTypes } = {}) {
    let injectedTypes = '';

    if (injectTypes) {
      injectedTypes = injectTypes();
    }
    return `${graphNode.name()} ( 
      ${buildGraphqlTypeFields(pub.inputFieldDefs)}
      ${injectedTypes} 
    ): ${graphNode.capitalizedName()}
    `;
  }

  function listQuery({ injectTypes }) {
    let injectedTypes = '';

    if (injectTypes) {
      injectedTypes = injectTypes();
    }
    return `${graphNode.tableName} ( 
      ${buildGraphqlTypeFields(pub.inputFieldDefs)}
      ${injectedTypes} 
    ): ${graphNode.capitalizedName()}List 
    `;
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
