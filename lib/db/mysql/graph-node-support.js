const log = require('mk-log');

const mysqlToGraphQLTypesMap =
  require('../../utils/db-to-graphql-types-map.js')('mysql');

const GraphqlMysqlResolveBuilder = require('../../resolvers/graphql-mysql-resolve-builder.js');

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

    const reducer = (domAttributes, [colName, attr]) => {
      domAttributes.set(colName, attr);
      return domAttributes;
    };

    const reducedFilteredAttributes = filteredAttributes.reduce(
      reducer, 
      new Map()
    );
    return reducedFilteredAttributes;
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
  prot.resolveBuilder = GraphqlMysqlResolveBuilder;
};
