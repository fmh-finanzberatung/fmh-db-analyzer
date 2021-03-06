const graphNodeName = require('./graph-node-name.js');
const capitalizeSnake = require('./utils/capitalize-snake.js');
// const log = require('mk-log');

module.exports = function GraphNode(tableName, tableDef, tapProto) {
  if (!tableName) {
    throw new Error('tableName must be provided on initialization');
  }

  const proto = {
    addAttribute(columnName, colProps) {
      let colPropsMap = this.attributes.get(columnName);
      if (!colPropsMap) colPropsMap = new Map();
      for (let key in colProps) {
        colPropsMap.set(key, colProps[key]);
      }
      this.attributes.set(columnName, colPropsMap);
    },
    traverse(startNodeName, parentNodeName, cb) {
      if (!startNodeName) startNodeName = this.name;
      cb(this.name, parentNodeName);
      this.edges.forEach((n) => {
        if (n === startNodeName) return false;
        n.traverse(startNodeName, this.name, cb);
      });
    },
    domesticAttributes() {
      throw new Error('domesticAttributes must be implemented via tapProto');
    },
    edges() {
      throw new Error('edges must be implemented via tapProto');
    },
    name() {
      // singularized table name
      return graphNodeName(this.tableName);
    },
    capitalizedName() {
      // capitalizing snaked table name
      return capitalizeSnake(graphNodeName(this.tableName));
    },
    getAttribute(attrKey) {
      const attribute = this.attributes.get(attrKey);
      return {
        value: attribute,
        prop(propKey) {
          if (attribute) {
            return attribute.get(propKey);
          }
        },
      };
    },
  };

  if (tapProto) {
    tapProto(proto);
  }

  const obj = Object.create(proto, {
    tableName: {
      type: String,
      value: '',
      enumerable: true,
      writable: true,
    },
    attributes: {
      type: Object,
      value: new Map(),
      enumerable: true,
    },
  });

  obj.tableName = tableName;

  if (tableDef) {
    for (let colName in tableDef) {
      const colProps = tableDef[colName];
      obj.addAttribute(colName, colProps);
    }
  }

  return obj;
};
