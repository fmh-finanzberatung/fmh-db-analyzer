const GraphNode = require('../../graph-node.js');
const graphNodeName = require('../../graph-node-name.js');
const log = require('mk-log');

function isForeignIdType(attrType) {
  return (
    attrType === 'ObjectID' ||
    (Array.isArray(attrType) &&
      (attrType.indexOf('ObjectID') >= 0 || attrType.indexOf('Array') >= 0))
  );
}

function mongoDomesticAttributes(_collections) {
  return function attributes() {
    const attributes = Array.from(this.attributes);

    const filteredDomesticAttributes = attributes.filter(
      ([_attrName, attrMap]) => {
        const attrType = attrMap.get('type');
        return !isForeignIdType(attrType);
      }
    );

    return filteredDomesticAttributes.reduce(
      (domAttributes, [colName, attr]) => {
        domAttributes.set(colName, attr);
        return domAttributes;
      },
      new Map()
    );
  };
}

function mongoEdges(_collections) {
  return function attributes() {
    const attributes = Array.from(this.attributes);
    const filteredEdgeAttributes = attributes.filter(([_attrName, attrMap]) => {
      const attrType = attrMap.get('type');

      return isForeignIdType(attrType);
    });

    /*
    return filteredEdgeAttributes.reduce((edgeAttributes, [colName, attr]) => {
      log.debug('colName', colName);
      edgeAttributes.set(colName, attr);
      return edgeAttributes;
    }, new Map());
    */
    return filteredEdgeAttributes;
  };
}

module.exports = function MongoSchemaAdapters(mongoSchema) {
  // outer most array
  // should have length of 1
  // middle array: collections
  // collection hold collection object with

  const collections = mongoSchema;

  log.debug('collections', JSON.stringify(collections, null, 4));

  const journal = new Map();

  collections.forEach((coll) => {
    const collName = coll.name;
    const gNodeName = graphNodeName(collName);
    let graphNode = journal.get(gNodeName);
    if (!graphNode) {
      graphNode = GraphNode(collName, null, (prot) => {
        prot.domesticAttributes = mongoDomesticAttributes(collections);
        prot.edges = mongoEdges(collections);
      });
    }

    coll.fields.forEach((field) => {
      graphNode.addAttribute(field.name, field);
    });

    journal.set(gNodeName, graphNode);
  });

  log.debug('journal', journal);

  return journal;
};
