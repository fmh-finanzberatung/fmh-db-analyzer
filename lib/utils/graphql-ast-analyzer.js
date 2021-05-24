const log = require('mk-log');
const Tap = require('./tap.js');
//const duration = require('humanize-duration');

module.exports = function GraphqlAstAnalyzer(ast) {
  const tap = Tap('selections');

  function traverseAst(astNode, key, parentPath) {
    //log.info('astNode keys', Object.keys(astNode));
    if (!parentPath) parentPath = [];
    if (parentPath.length > 10) return false;
    const astPath = parentPath.slice();
    if (key) astPath.push(key);

    if (key && `${key}`.match(/next|prev|startToken|endToken|loc/))
      return false;

    if (astPath.length && !astPath[0].match(/fieldNodes/)) {
      return false;
    }
    //console.log(astPath.join('.'));
    //if (astPath[0] === 'fieldNodes') {
    //  console.log('astPath', astPath.join('.'));
    //}
    //else {
    //  return false;
    //}
    //console.log(astPath.join('.'));

    // error must be caught here otherwise
    // it's never shown
    try {
      if (Array.isArray(astNode)) {
        //console.log(key);

        if (key === 'selections') {
          //log.info('selections', astNode);
          astNode.forEach((n) => {
            tap
              .fire('selections')
              .with('field', { name: n.name.value, alias: n.alias });
          });
        }

        astNode.forEach((n, index) => {
          traverseAst(n, index, astPath);
        });
      } else if (typeof astNode === 'object') {
        for (let key in astNode) {
          traverseAst(astNode[key], key, astPath);
        }
      } else {
        astPath.push(astNode);
        console.log(astPath.join('.'));
      }
    } catch (err) {
      log.error(err);
    }
  }

  return {
    tap,
    run() {
      const start = Date.now();
      traverseAst(ast);
      //log.info('duration', duration(Date.now() - start));
      //log.info(Object.keys(ast));
    },
  };
};
