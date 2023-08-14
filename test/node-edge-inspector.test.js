const tape = require("tape");
const log = require("mk-log");
const journal = require("./mockups/journal.mockup.js");
const NodeEdgeInspector = require("../lib/graph-node/node-edge-inspector.js");

tape((t) => {
  journal.forEach((node) => {
    const inspector = NodeEdgeInspector(node, journal);

    console.log(`======== inspecting for ${node.name()} ========`);

    inspector.addEventListener("association", (node) => {
      console.log("required association:", node.name());
    });
    inspector.addEventListener("parent", (node) => {
      console.log("parent              :", node.name());
    });
    inspector.addEventListener("children", (node) => {
      console.log("children            :", node.name());
    });
    inspector.addEventListener("belongsTo", (node) => {
      console.log("belongsTo           :", node.name());
    });
    inspector.addEventListener("hasMany", (node) => {
      //console.log('\nhasMany             :', node);
      console.log("hasMany             :", node.name());
    });
    inspector.addEventListener(
      "belongsToManyThrough",
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
