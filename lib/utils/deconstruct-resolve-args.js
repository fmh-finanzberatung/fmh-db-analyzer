// if there is no root then there are only three args and
// resArgs becomes first arguments
// This function sanitizes this and allways returns root
// If there is no root root becomes null
// const log = require('mk-log');
module.exports = function deconstructResolveArgs(...resArgs) {
  if (resArgs.length === 4) {
    return {
      root: resArgs[0],
      args: resArgs[1],
      context: resArgs[2],
      ast: resArgs[3],
    };
  }
  return {
    root: null,
    args: resArgs[0],
    context: resArgs[1],
    ast: resArgs[2],
  };
};
