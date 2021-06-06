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
    createInput,
    updateInput,
    deleteInput,
    singleCreateMutation,
    listCreateMutation,
    singleUpdateMutation,
    listUpdateMutation,
    singleDeleteMutation,
    listDeleteMutation,
  };

  function deleteInput({ injectTypes, injectParams } = {}) {
    let injectedParams = '';
    let injectedTypes = '';

    if (injectParams) {
      injectedParams = injectParams();
    }
    if (injectTypes) {
      injectedTypes = injectTypes();
    }

    return `input ${graphNode.capitalizedName()}DeleteInput { 
      ${buildGraphqlTypeFields(pub.inputFieldDefs)}
      ${injectedParams}
      ${injectedTypes}
    }`;
  }

  function createInput({ injectTypes, injectParams } = {}) {
    let injectedParams = '';
    let injectedTypes = '';

    if (injectParams) {
      injectedParams = injectParams();
    }
    if (injectTypes) {
      injectedTypes = injectTypes();
    }

    return `input ${graphNode.capitalizedName()}CreateInput { 
      ${buildGraphqlTypeFields(pub.inputFieldDefs)}
      ${injectedParams}
      ${injectedTypes}
    }`;
  }

  function updateInput({ injectTypes, injectParams } = {}) {
    let injectedParams = '';
    let injectedTypes = '';

    if (injectParams) {
      injectedParams = injectParams();
    }
    if (injectTypes) {
      injectedTypes = injectTypes();
    }

    return `
    input ${graphNode.capitalizedName()}UpdateInput { 
      ${buildGraphqlTypeFields(pub.inputFieldDefs)}
      ${injectedParams}
      ${injectedTypes}
    }`;
  }

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

  function singleCreateMutation() {
    return `create${graphNode.capitalizedName()} ( 
      input: ${graphNode.capitalizedName()}CreateInput
    ): ${graphNode.capitalizedName()}
    `;
  }

  function listCreateMutation() {
    return `create${graphNode.capitalizedName()}List ( 
      inputList: [${graphNode.capitalizedName()}CreateInput]
    ): [${graphNode.capitalizedName()}]
    `;
  }

  function singleUpdateMutation() {
    return `update${graphNode.capitalizedName()} (
      update: ${graphNode.capitalizedName()}UpdateInput
    ): ${graphNode.capitalizedName()}
    `;
  }

  function listUpdateMutation() {
    return `update${graphNode.capitalizedName()}List ( 
      updateList: [${graphNode.capitalizedName()}UpdateInput]
    ): [${graphNode.capitalizedName()}]
    `;
  }

  function singleDeleteMutation({ injectTypes } = {}) {
    let injectedTypes = '';

    if (injectTypes) {
      injectedTypes = injectTypes();
    }
    return `delete${graphNode.capitalizedName()} ( 
      ${buildGraphqlTypeFields(pub.inputFieldDefs)}
      ${injectedTypes} 
    ): ${graphNode.capitalizedName()}
    `;
  }

  function listDeleteMutation({ injectTypes } = {}) {
    let injectedTypes = '';

    if (injectTypes) {
      injectedTypes = injectTypes();
    }
    return `delete${graphNode.capitalizedName()}List ( 
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
