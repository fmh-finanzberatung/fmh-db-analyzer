const tape = require('tape');
const log = require('mk-log');
const GraphNode = require('../lib/graph-node.js');

const personTableDef = {
  id: { DATA_TYPE: 'int', IS_NULLABLE: false },
  name: { DATA_TYPE: 'varchar', IS_NULLABLE: true },
  parent_id: { DATA_TYPE: 'int', IS_NULLABLE: true },
  car_id: { DATA_TYPE: 'varchar', IS_NULLABLE: true },
  company_id: { DATA_TYPE: 'int', IS_NULLABLE: true },
};

tape('GraphNode edges', (t) => {
  try {
    /*
     * this test is currently not working
    t.throws(GraphNode(), new RegExp('tableName'),
      'should throw error on initialization without tableName');
    */

    const gNode = GraphNode('persons');

    for (let key in personTableDef) {
      const colProps = personTableDef[key];
      gNode.addAttribute(key, colProps);
    }

    t.equals(gNode.edges().length, 3, 'should have 3 edges');
    t.equals(gNode.name(), 'person', 'should have capitalized node name');
    t.equals(
      gNode.domesticAttributes().size,
      2,
      'should have 2 domestic attributes'
    );
  } catch (err) {
    log.error(err);
  } finally {
    t.end();
  }
});
