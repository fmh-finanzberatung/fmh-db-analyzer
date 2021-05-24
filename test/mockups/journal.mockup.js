const GraphNode = require('../../lib/graph-node.js');

const personTableDef = {
  id: { dataType: 'integer', nullable: false },
  name: { dataType: 'string', nullable: true },
  company_id: { dataType: 'integer', nullable: true },
};

const carTableDef = {
  id: { dataType: 'integer', nullable: false },
  name: { dataType: 'string', nullable: true },
  person_id: { dataType: 'integer', nullable: true },
  manufacturer_id: { dataType: 'integer', nullable: true },
};

const sessionTableDef = {
  id: { dataType: 'integer', nullable: false },
  person_id: { dataType: 'integer', nullable: true },
};

const companyTableDef = {
  id: { dataType: 'integer', nullable: false },
  name: { dataType: 'string', nullable: true },
  parent_id: { dataType: 'integer', nullable: false },
};

const manufacturerTableDef = {
  id: { dataType: 'integer', nullable: false },
  name: { dataType: 'string', nullable: true },
};

const personNode = GraphNode('persons', personTableDef);
const carNode = GraphNode('cars', carTableDef);
const sessionNode = GraphNode('sessions', sessionTableDef);
const manufacturerNode = GraphNode('manufacturers', manufacturerTableDef);
const companyNode = GraphNode('companies', companyTableDef);

const journal = new Map();
journal.set(personNode.name(), personNode);
journal.set(carNode.name(), carNode);
journal.set(sessionNode.name(), sessionNode);
journal.set(companyNode.name(), companyNode);
journal.set(manufacturerNode.name(), manufacturerNode);

module.exports = journal;
