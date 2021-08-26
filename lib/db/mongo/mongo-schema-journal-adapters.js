const GraphNode = require('../../graph-node.js');
const graphNodeName = require('../../graph-node-name.js');
const log = require('mk-log');

function mongoDomesticAttributes() {
  const attributes = Array.from(this.attributes);

  log.info('attributes', attributes);

  const filteredAttributes = attributes.filter(([attrName, attrMap]) => {
    log.info('attrName', attrName);
    log.info('attr Map', attrMap);

    return attrMap.get('DATA_TYPE') !== 'objectId';
  });

  log.debug('filteredAttributes ++++++++++ ', filteredAttributes);

  return filteredAttributes.reduce((domAttributes, [colName, attr]) => {
    log.debug('colName', colName);
    domAttributes.set(colName, attr);
    return domAttributes;
  }, new Map());
}

function mongoEdges() {
  const attributes = Array.from(this.attributes);
  return attributes
    .filter(([colName]) => colName.match(/Id$/))
    .map(([colName]) => '' + colName.replace(/Id$/, ''));
}

module.exports = function MongoSchemaAdapters(mongoSchema) {
  // outer most array
  // should have length of 1
  // middle array: collections
  // collection hold collection object with
  // { _id: "[collection name],
  //   allkeysandvalues: {_id: objectId, key0: type, key1: type}

  const collections = mongoSchema;
  const journal = new Map();

  collections.forEach((coll) => {
    log.info('coll', coll);
    log.info('coll', typeof coll);
    const collName = coll._id;
    log.info('collName', collName);
    const gNodeName = graphNodeName(collName);
    let graphNode = journal.get(gNodeName);
    if (!graphNode) {
      graphNode = GraphNode(collName, null, (prot) => {
        prot.domesticAttributes = mongoDomesticAttributes;
        prot.edges = mongoEdges;
      });
    }

    log.debug('collObj.allkeysandvalues', coll.allkeysandvalues);
    for (let key in coll.allkeysandvalues) {
      graphNode.addAttribute(key, coll.allkeysandvalues[key]);
    }

    log.debug(
      'graphNode mongo domesticAttributes *******',
      graphNode.domesticAttributes()
    );

    /*
      let graphNode = journal.get(gNodeName);
      if (!graphNode) {
        graphNode = GraphNode(tableName);
      }

      const colName = row['COLUMN_NAME'];
      graphNode.addAttribute(colName, row);
      */
    journal.set(gNodeName, graphNode);
  });

  log.debug('journal', journal);

  return journal;
};
