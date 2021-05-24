const prettier = require('prettier/standalone');
const plugins = [require('prettier/parser-graphql')];

module.exports = function prettyGraphql(source) {
  return prettier.format(source, {
    parser: 'graphql',
    plugins,
  });
};
