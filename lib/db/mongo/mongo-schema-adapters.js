const GraphNode = require('../../graph-node.js');
const graphNodeName = require('../../graph-node-name.js');
const log = require('mk-log');

module.exports = function MongoSchemaAdapters(mongoSchema) {
  // outer most array
  // should have length of 1
  // middle array: collections
  // collection hold collection object with
  // { _id: "[collection name],
  //   allkeysandvalues: {_id: objectId, key0: type, key1: type}

  const collections = mongoSchema;
  log.info('collections', collections);
  const journal = new Map();

  collections.forEach((coll) => {
    const collObj = coll[0];
    const collName = collObj._id;
    const gNodeName = graphNodeName(collName);
    const graphNode = GraphNode(collName, null, (prot) => {
      prot.domesticAttributes = function domesticAttributes() {
        const attributes = Array.from(this.attributes);
        log.info(attributes);

        return new Map();
      };
    });
    console.log('collObj.allkeysandvalues', collObj.allkeysandvalues);
    for (let key in collObj.allkeysandvalues) {
      graphNode.addAttribute(key, collObj.allkeysandvalues[key]);
    }

    log.info(
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

  log.info('journal', journal);

  return journal;
};
