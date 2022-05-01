const log = require('mk-log');
const tape = require('tape');
const centerText = require('../../lib/utils/center-text.js');

tape((t) => {
  const text = 'hello world';
  const width = 20;
  const expected = '    hello world     ';
  const actual = centerText(text, width);
  t.equal(actual, expected);
  t.end();
});
