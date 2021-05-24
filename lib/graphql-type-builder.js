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

  function singleType(inject) {
    let injectedCode = '';
    if (inject) {
      injectedCode = inject();
    }
    return `type ${graphNode.capitalizedName()} {
      ${buildGraphqlTypeFields(pub.fieldDefs)}
      ${buildGraphqlTypeFields(pub.resultFieldDefs)}
      ${injectedCode} 
    }`;
  }

  function listType(inject) {
    let injectedCode = '';
    if (inject) {
      injectedCode = inject();
    }
    return `type ${graphNode.capitalizedName()}List {
      docs: [${graphNode.capitalizedName()}] 
      ${injectedCode} 
    }`;
  }

  function singleQuery(inject) {
    let injectedCode = '';
    if (inject) {
      injectedCode = inject();
    }
    return `${graphNode.name()} ( 
      ${buildGraphqlTypeFields(pub.fieldDefs)}
      ${injectedCode} 
    ): ${graphNode.capitalizedName()}
    `;
  }

  function listQuery(inject) {
    let injectedCode = '';
    if (inject) {
      injectedCode = inject();
    }
    return `${graphNode.tableName} ( 
      ${buildGraphqlTypeFields(pub.fieldDefs)}
      ${injectedCode} 
    ): ${graphNode.capitalizedName()}List 
    `;
  }

  pub.addFieldDef = function addFieldDef(name, graphqlType) {
    pub.fieldDefs.set(name, graphqlType);
  };

  pub.addResultFieldDef = function addResultFieldDef(name, graphqlType) {
    //console.log('name:      :', name);
    //console.log('graphqlType:', graphqlType);
    pub.resultFieldDefs.set(name, graphqlType);
  };

  return pub;
};
