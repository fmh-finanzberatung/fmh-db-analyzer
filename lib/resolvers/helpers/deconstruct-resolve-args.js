// if there is no root then there are only three args and
// resArgs becomes first arguments
// This function sanitizes this and always returns root
// If there is no root root becomes null
// const log = require('mk-log');
module.exports = function deconstructResolveArgs(...resArgs) {
  if (resArgs.length === 4) {
    return resArgs;
  }
  throw new Error(`resolveArgs must have length of 4 but has: ${3}`);
  //return [null, resArgs[0], resArgs[1], resArgs[2]];
};
