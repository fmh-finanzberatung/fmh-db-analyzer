const tape = require('tape');
// const log = require('mk-log');
const RandomString = require('../../lib/utils/random-string.js');

tape('random string', (t) => {

  const rsMixed = RandomString(10).mixed();
  t.equals(10, rsMixed.length);
  const rsChars =  RandomString(10).chars();
  t.notEquals(rsMixed, rsChars);
  const rsCapitalChars = RandomString(10).capitalChars();
  t.notEquals(rsChars, rsCapitalChars);
  const rsDigits = RandomString(5).digits();
  t.notEquals(rsChars, rsDigits);
  t.end(); 

});


