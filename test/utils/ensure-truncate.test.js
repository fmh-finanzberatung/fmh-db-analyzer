const log = require('mk-log');
const ELLIPSIS = '…';
const tape = require('tape');
const {ensureTruncate, Const} = require('../../lib/utils/ensure-truncate.js');

tape( (t) => {
  t.equal(
    ensureTruncate('', {maxWidth: 0}),
    ''
  );
  t.equal(
    ensureTruncate('A', {maxWidth: 0}),
    ''
  );
  t.equal(
    ensureTruncate('A', {maxWidth: 5}),
    'A',
    'should return original string if string is shorter than max length'
  );
  t.equal(
    ensureTruncate('My Home, my Oklahoma Home'),
    'My Home, ' + ELLIPSIS,
    'Default max width is 10'
  );
  t.equal(
    ensureTruncate('My Home, my Oklahoma Home', {maxWidth: 15}),
    'My Home, my Ok' + ELLIPSIS,
    'Max width is set to 15'
  );
  log.info('OVERFLOW_TYPE_LEFT', Const.OVERFLOW_TYPE_LEFT);
  t.equal(
    ensureTruncate('My Home, my Oklahoma Home', {maxWidth: 15, ellipsis: ELLIPSIS,
    overflowType: Const.OVERFLOW_TYPE_LEFT }),
    ELLIPSIS + 'y Oklahoma Home',
    'Max width is set to 15'
  );
  t.end();
});
