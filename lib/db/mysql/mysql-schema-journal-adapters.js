const GraphNode = require('../../graph-node.js');
const graphNodeName = require('../../graph-node-name.js');
const log = require('mk-log');

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
    .filter(([colName]) => colName.match(/_id$/))
    .map(([colName]) => '' + colName.replace(/_id$/, ''));
}

module.exports = function MysqlSchemaJournalAdapters(dbSchemaReader) {
  // outer most array: databases
  // should have length of 1
  // middle array: tables
  // inner most array: columns
  const rows = dbSchemaReader.flat();
  const journal = new Map();

  rows
    .filter((row) => !row.TABLE_NAME.match(/knex/))
    .forEach((row) => {
      const tableName = row.TABLE_NAME;
      const gNodeName = graphNodeName(tableName);

      let graphNode = journal.get(gNodeName);
      if (!graphNode) {
        graphNode = GraphNode(tableName, null, (prot) => {
          prot.domesticAttributes = mysqlDomesticAttributes;
          prot.edges = mysqlEdges;
        });
      }

      const colName = row['COLUMN_NAME'];

      graphNode.addAttribute(colName, row);
      journal.set(gNodeName, graphNode);
    });
  return journal;
};
