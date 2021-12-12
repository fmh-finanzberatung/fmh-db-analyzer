const log = require('mk-log');

const mysqlToGraphQLTypesMap = require('../../utils/db-to-graphql-types-map')(
  'mysql'
);

// setting function for identifying
// data and relation columns
// Must be provided for all database types

// tree edges i.e. parent and children are treated
// differently from other regular edges
module.exports = function GraphNodeSupport(prot) {
  function mysqlDomesticAttributes() {
    const attributes = Array.from(this.attributes);
    const filteredAttributes = attributes.filter(
      ([colName]) => !colName.match(/_id$/)
    );
    return filteredAttributes.reduce((domAttributes, [colName, attr]) => {
      log.debug('colName', colName);
      domAttributes.set(colName, attr);
      return domAttributes;
    }, new Map());
  }

  function mysqlEdges() {
    const attributes = Array.from(this.attributes);
    return attributes
      .filter(
        ([colName]) => colName.match(/_id$/) && !colName.match(/parent_id/)
      )
      .map(([colName]) => colName.replace(/_id$/, ''));
  }

  function mysqlTreeEdges() {
    const attributes = Array.from(this.attributes);
    const treeAttributes = attributes
      .filter(([colName]) => colName.match(/parent_id$/))
      .map(([colName]) => colName.replace(/_id$/, ''));

    if (treeAttributes.length > 0) {
      treeAttributes.push('children');
      return treeAttributes;
    }
    return [];
  }

  prot.domesticAttributes = mysqlDomesticAttributes;
  prot.edges = mysqlEdges;
  prot.treeEdges = mysqlTreeEdges;
  prot.dbToGraphqlTypesMap = mysqlToGraphQLTypesMap;
};
