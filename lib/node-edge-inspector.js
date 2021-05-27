const nodeRelations = require('./node-relations');

module.exports = function NodeEdgeInspector(inspectedNode, journal) {
  const handlers = nodeRelations.reduce((obj, a) => {
    obj[a] = [];
    return obj;
  }, {});

  function fireEvent(name, ...evArgs) {
    if (!handlers[name]) {
      throw new Error(
        `Event "${
          handlers[name]
        }" cannot get fired. Event must be one of ${Object.keys(handlers).join(
          ', '
        )}`
      );
    }
    handlers[name].forEach((h) => h(...evArgs));
  }

  const pub = {
    addEventListener(name, fn) {
      if (!handlers[name]) {
        throw new Error(
          `Event "${
            handlers[name]
          }" cannot get registered. Event must be one of ${Object.keys(
            handlers
          ).join(', ')}`
        );
      }
      handlers[name].push(fn);
    },
    run() {
      inspectedNode.edges().filter((neighbourEdge) => {
        if (neighbourEdge === 'parent') {
          fireEvent('parent', inspectedNode);
          fireEvent('children', inspectedNode);
          fireEvent('root', inspectedNode);
          fireEvent('roots', inspectedNode);
          // ignore parent from now on
          return false;
        }
        const neighbourNode = journal.get(neighbourEdge);
        fireEvent('belongsTo', neighbourNode);
        return true;
      });
      Array.from(journal.entries())
        .map(([_name, journalNode]) => journalNode)
        .filter((journalNode) => {
          // ignore the journal node if it is identical with
          // the currently inspected node
          // we use all edge nodes which include the currently
          // inspected node
          return journalNode.edges().includes(inspectedNode.name());
        })
        .forEach((neighbourNode) => {
          // must fire
          fireEvent('association', neighbourNode);
          fireEvent('hasMany', neighbourNode);

          neighbourNode
            .edges()
            .filter((yonderEdge) => {
              if (yonderEdge === 'parent') return false;
              if (yonderEdge === inspectedNode.name()) return false;
              return true;
            })
            .forEach((yonderEdge) => {
              const yonderNode = journal.get(yonderEdge);
              // must fire
              fireEvent('belongsToManyThrough', yonderNode, neighbourNode);
            });
        });

      journal.edges;
    },
  };
  return pub;
};
