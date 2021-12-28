//const GraphNode = require('../../graph-node.js');
const GraphNode = require('../../graph-node/graph-node.js');
const graphNodeName = require('../../graph-node/graph-node-name.js');
const MysqlGraphNodeSupport = require('../../db/mysql/graph-node-support.js');

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
        graphNode = GraphNode(tableName, null, MysqlGraphNodeSupport);
      }

      const colName = row['COLUMN_NAME'];

      graphNode.addAttribute(colName, row);
      journal.set(gNodeName, graphNode);
    });
  return journal;
};
