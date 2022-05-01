const ELLIPSIS = '…';
const tape = require('tape');
const ensureMaxWordLengthEllipsis = require('../../lib/utils/ensure-max-word-length-ellipsis.js');

tape( (t) => {
  t.equal(
    ensureMaxWordLengthEllipsis('', {maxWidth: 0}),
    ''
  );
  t.equal(
    ensureMaxWordLengthEllipsis('A', {maxWidth: 0}),
    ''
  );
  t.equal(
    ensureMaxWordLengthEllipsis('A', {maxWidth: 5}),
    'A',
    'should return original string if string is shorter than max length'
  );
  t.equal(
    ensureMaxWordLengthEllipsis('My Home, my Oklahoma Home'),
    'My Home, ' + ELLIPSIS,
    'Default max width is 10'
  );
  t.equal(
    ensureMaxWordLengthEllipsis('My Home, my Oklahoma Home', {maxWidth: 15}),
    'My Home, my Ok' + ELLIPSIS,
    'Max width is set to 15'
  );
  t.end();
});
