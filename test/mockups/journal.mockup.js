const GraphNode = require('../../lib/graph-node.js');

module.exports = function JournalMockup(DbGraphNodeSupport) {
  const personTableDef = {
    id: { DATA_TYPE: 'int', IS_NULLABLE: false },
    active: { DATA_TYPE: 'tinyint', IS_NULLABLE: false },
    name: { DATA_TYPE: 'varchar', IS_NULLABLE: true },
    company_id: { DATA_TYPE: 'int', IS_NULLABLE: true },
  };

  const carTableDef = {
    id: { DATA_TYPE: 'int', IS_NULLABLE: false },
    active: { DATA_TYPE: 'tinyint', IS_NULLABLE: false },
    name: { DATA_TYPE: 'varchar', IS_NULLABLE: true },
    person_id: { DATA_TYPE: 'int', IS_NULLABLE: true },
    manufacturer_id: { DATA_TYPE: 'int', IS_NULLABLE: true },
  };

  const sessionTableDef = {
    id: { DATA_TYPE: 'int', IS_NULLABLE: false },
    active: { DATA_TYPE: 'tinyint', IS_NULLABLE: false },
    person_id: { DATA_TYPE: 'int', IS_NULLABLE: true },
  };

  const companyTableDef = {
    id: { DATA_TYPE: 'int', IS_NULLABLE: false },
    active: { DATA_TYPE: 'tinyint', IS_NULLABLE: false },
    name: { DATA_TYPE: 'varchar', IS_NULLABLE: true },
    parent_id: { DATA_TYPE: 'int', IS_NULLABLE: false },
  };

  const manufacturerTableDef = {
    id: { DATA_TYPE: 'int', IS_NULLABLE: false },
    active: { DATA_TYPE: 'tinyint', IS_NULLABLE: false },
    name: { DATA_TYPE: 'varchar', IS_NULLABLE: true },
  };

  const personNode = GraphNode('persons', personTableDef, DbGraphNodeSupport);

  const carNode = GraphNode('cars', carTableDef, DbGraphNodeSupport);
  const sessionNode = GraphNode(
    'sessions',
    sessionTableDef,
    DbGraphNodeSupport
  );
  const manufacturerNode = GraphNode(
    'manufacturers',
    manufacturerTableDef,
    DbGraphNodeSupport
  );
  const companyNode = GraphNode(
    'companies',
    companyTableDef,
    DbGraphNodeSupport
  );

  const journal = new Map();
  journal.set(personNode.name(), personNode);
  journal.set(carNode.name(), carNode);
  journal.set(sessionNode.name(), sessionNode);
  journal.set(companyNode.name(), companyNode);
  journal.set(manufacturerNode.name(), manufacturerNode);
  return journal;
};
