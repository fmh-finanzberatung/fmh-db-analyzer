// const log = require('mk-log');
/**
 * @module tap
 * @param {Array} tapNames
 */
module.exports = function tap(...tapNames) {
  /**
   * Will be { schema: { fieldName: [functions] } }
   * @type {Object.<Object>}
   */
  const taps = tapNames.reduce((o, c) => {
    o[c] = {};
    return o;
  }, {});

  return {
    into(tapName) {
      if (!taps[tapName]) {
        throw new Error(
          `Wrong event name '${tapName}', must be one of ${tapNames.join(', ')}`
        );
      }
      let tapForName = taps[tapName];
      if (!tapForName) tapForName = {};
      return {
        with(eventName, fn) {
          let handlerList = tapForName[eventName];
          if (!handlerList) handlerList = [];
          handlerList.push(fn);
          tapForName[eventName] = handlerList;
          taps[tapName] = tapForName;
        },
      };
    },
    fire(tapName) {
      if (!taps[tapName]) {
        throw new Error(
          `Wrong event name '${tapName}', must be one of ${tapNames.join(', ')}`
        );
      }
      return {
        with(eventName, ...handlerArgs) {
          const handlers = taps[tapName][eventName];

          if (!handlers) return false;
          handlers.forEach((h) => {
            h(...handlerArgs);
          });
        },
      };
    },
  };
};
