const tape = require('tape');
const Cursor = require('../../lib/utils/cursor.js');
const BorderDefs = require('../../lib/utils/frames/border-defs.js');
const log = require('mk-log');

//tape('test cursor', (t) => {

const cur = Cursor();

cur
  .StatusBar({})(6, 4, 20, 1);
cur
  .Select({
    prompt: 'What?',
    list: [
      { value: 0, label: 'MacOS' },
      { value: 1, label: 'Windows' },
      { value: 2, label: 'Linux' },
      { value: 4, label: 'FreeBSD' },
    ],
  })(6, 6, 20)
  .around(
    cur.Border({
      char: '+',
      borderDefs: BorderDefs[BorderDefs.Const.BORDER_TYPE_SINGLE],
    })
  )
  .around(cur.Label({ title: 'Companies' }))
  .around(
    cur.TabKey({})
  );
  //.select(1);

cur
  .Select({
    prompt: 'What?',
    list: [
      { value: 0, label: 'Mr' },
      { value: 1, label: 'Mrs' },
    ],
  })(6, 13, 10)
  .around(
    cur.Border({
      char: '+',
      borderDefs: BorderDefs[BorderDefs.Const.BORDER_TYPE_SINGLE],
    })
  )
  .around(cur.Label({ title: 'Gender' }))
  .around(
    cur.TabKey({})
  );
  //.select(1);

cur
  .TextField({ placeholder: '' })(6, 18, 20)
  .around(
    cur.Border({
      char: '+',
      borderDefs: BorderDefs[BorderDefs.Const.BORDER_TYPE_SINGLE],
    })
  )
  .around(
    cur.TabKey({})
  )
  .addInputListener(() => {})
  .around(cur.Label({ title: 'Family Name' }));
