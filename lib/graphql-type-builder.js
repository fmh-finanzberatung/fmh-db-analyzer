//const tap = require('./utils/tap.js');
//const log = require('mk-log');
const buildGraphqlTypeFields = require('./build-graphql-type-fields.js');

module.exports = function GraphqlTypeBuilder(graphNode) {
  const pub = {
    fieldDefs: new Map(),
    resultFieldDefs: new Map(),
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
      ${buildGraphqlTypeFields(pub.fieldDefs)}
      ${buildGraphqlTypeFields(pub.resultFieldDefs)}
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
      ${buildGraphqlTypeFields(pub.fieldDefs)}
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
      ${buildGraphqlTypeFields(pub.fieldDefs)}
      ${injectedTypes} 
    ): ${graphNode.capitalizedName()}List 
    `;
  }

  pub.addFieldDef = function addFieldDef(name, graphqlType) {
    pub.fieldDefs.set(name, graphqlType);
  };

  pub.addResultFieldDef = function addResultFieldDef(name, graphqlType) {
    pub.resultFieldDefs.set(name, graphqlType);
  };

  return pub;
};
