import GraphNode from '../../graph-node/graph-node.js';
import graphNodeName from '../../graph-node/graph-node-name.js';
import MysqlGraphNodeSupport from '../../db/mysql/graph-node-support.js';
import log from 'mk-log';

/* check if edgeName is polymorphic
   each polymorphic edge needs get checked
   on the attributes of all journal nodes */
function findPolymorphicAttributesNodes(journal, edgeBaseName) {
  // edgeName is the base name of the polymorphic node
  // loop through all nodes
  const result = [];
  journal.forEach((node, _nodeName) => {
    // loop through all attributes of a node
    node.attributes.forEach((_attr, edgeName) => {
      const splittedEdgeBaseName = edgeBaseName.split('_');
      for (let i = 0, l = splittedEdgeBaseName.length; i < l; i++) {
        const edgeBaseNameFragment = splittedEdgeBaseName.slice(i).join('_');
        /* TOOO
         * we're not through yet
         * the form of the edgeName is most likely something like
         * 'customer_user_id' while the edgeBaseName is 'users'
         * so we need to remove the _id and pluralize
         * the remaining part of the edgeName like so:
         * 'customer_user' -> 'customers_users'
         */
        // maps forEach pass valee, key, map
        if (edgeName === edgeBaseNameFragment) {
          // we found a polymorphic node
          // so let's add it to the result
          return result.push([node, edgeName]);
        }
      }
    });
  });
  return result;
}

function ensurePolymorphicNodes(journal) {
  let results = [];
  journal.forEach((node, edgeName) => {
    // we only need to check nodes with type attribute
    if (!node.attributes.has('type')) return false;
    // this is a polymorphic node so let's check
    // if there are other nodes with attributes/edges
    // matching the name of this node
    const foundResults = findPolymorphicAttributesNodes(journal, edgeName);
    results = [...results, ...foundResults];
  });
}

export default function MysqlSchemaJournalAdapters(dbSchemaReader) {
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

  // TODO: this function should be optional
  // because type might not always be a
  // polymorphic edge

  //log.info('journal', journal);
  // find all polymorphic nodes
  const polymorphicNodeNames = Array.from(journal)
    .filter(([gNodeName, graphNode]) => {
      //const edges = graphNode.edges();
      //log.info('graphNode', graphNode.tableName);
      //log.info('graphNode', graphNode.attributes.get('type'));
      if (graphNode.attributes.has('type')) return true;
    })
    .map(([gNodeName]) => gNodeName);

  // log.info('polymorphicNodeNames', polymorphicNodeNames);

  ensurePolymorphicNodes(journal, polymorphicNodeNames);

  // find all polymorphic edges
  //const nodesWithPolymorphicEdges = polymorphicNodeNames.filter((gnodeName) => {
  //  log.info('gnodeName:', gnodeName);
  //  findPolymorphicNode(journal, gnodeName);
  //});

  /*
  journal.forEach((graphNode) => {
    //  
    if (!graphNode.attributes.has('type')) return false; 
    log.info('graphNode', graphNode.tableName);
    log.info('graphNode', graphNode.attributes.get('type'));
    
  });
  */
  return journal;
};
