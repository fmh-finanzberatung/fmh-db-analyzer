const log = require('mk-log');
const NodeEdgeInspector = require('../../node-edge-inspector.js');

module.exports = function MysqlModelBuilder(journal, Bookshelf) {
  const tapHandlers = {
    schemaDef: {},
    schema: {},
  };

  const pub = {
    models: new Map(),

    tap(tapName, modelName, fnc) {
      if (!tapHandlers[tapName]) {
        throw new Error(
          `Wrong event name '${tapName}', must be one of ${Object.keys(
            tapHandlers
          ).join(', ')}`
        );
      }
      let tapForModel = tapHandlers[tapName][modelName];
      if (!tapForModel) tapForModel = [];
      tapForModel.push(fnc);
      tapHandlers[tapName][modelName] = tapForModel;
    },
    run() {
      journal.forEach((node) => {
        const schemaDef = {
          hasTimestamps: true,
          tableName: node.tableName,
        };

        const inspector = NodeEdgeInspector(node, journal);
        log.debug(`======== inspecting for ${node.name()} ========`);

        inspector.addEventListener('association', (_) => {
          // nothing here
        });
        inspector.addEventListener('parent', (node) => {
          schemaDef.parent = function parent() {
            return this.belongsTo(node.name(), node.tableName, 'parent_id');
          };
        });
        inspector.addEventListener('children', (node) => {
          schemaDef.parent = function children() {
            return this.hasMany(node.name(), node.tableName, 'parent_id');
          };
        });
        inspector.addEventListener('belongsTo', (node) => {
          schemaDef[node.name()] = function () {
            return this.belongsTo(node.capitalizedName());
          };
        });
        inspector.addEventListener('hasMany', (node) => {
          schemaDef[node.tableName] = function () {
            return this.hasMany(node.capitalizedName());
          };
        });
        inspector.addEventListener(
          'belongsToManyThrough',
          (yonderNode, neighbourNode) => {
            schemaDef[node.tableName] = function () {
              return this.belongsToMany(yonderNode.capitalizedName()).through(
                neighbourNode.capitalizedName()
              );
            };
          }
        );

        inspector.run();

        if (tapHandlers?.schemaDef?.[node.capitalizedName()]) {
          tapHandlers?.schemaDef?.[node.capitalizedName()]?.forEach?.((h) =>
            h(schemaDef, node)
          );
        }

        const Schema = Bookshelf.Model.extend(schemaDef);

        if (tapHandlers?.schema?.[node.capitalizedName()]) {
          tapHandlers?.schema?.[node.capitalizedName()]?.forEach?.((h) =>
            h(Schema, node)
          );
        }

        const Model = Bookshelf.model(node.capitalizedName(), Schema);

        pub.models.set(node.capitalizedName(), Model);
      });
    },
  };
  return pub;
};
