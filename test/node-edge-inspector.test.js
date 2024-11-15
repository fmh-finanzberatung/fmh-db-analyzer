import tape from 'tape';
import log from 'mk-log';
import journalMockup from './mockups/journal.mockup.js';
import NodeEdgeInspector from '../lib/graph-node/node-edge-inspector.js';
import DbGraphNodeSupport from '../lib/db/mysql/graph-node-support.js';

tape((t) => {
  const journal = journalMockup(DbGraphNodeSupport);
  //log.info('journal', journal);
  journal.forEach((node) => {
    const inspector = NodeEdgeInspector(node, journal);

    console.log(`======== node-edge-inspector.test.js   ========`);
    console.log(`======== inspecting for ${node.name()} ========`);

    inspector.addEventListener('association', (node) => {
      console.log('required association:', node.name());
    });
    inspector.addEventListener('parent', (node) => {
      console.log('parent              :', node.name());
    });
    inspector.addEventListener('children', (node) => {
      console.log('children            :', node.name());
    });
    inspector.addEventListener('belongsTo', (node) => {
      console.log('belongsTo           :', node.name());
    });
    inspector.addEventListener('hasMany', (node) => {
      //console.log('\nhasMany             :', node);
      console.log('hasMany             :', node.name());
    });
    inspector.addEventListener(
      'belongsToManyThrough',
      (yonderNode, neighbourNode) => {
        console.log(
          `belongsToManyThrough: ${yonderNode.name()} through ${neighbourNode.name()}`
        );
      }
    );

    inspector.run();
  });

  t.end();
});
