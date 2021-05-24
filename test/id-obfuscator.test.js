const tape = require('tape');
const IdObfusctor = require('../lib/utils/id-obfuscator.js');

tape((t) => {
  const id = 5;
  let obfuscatedId = IdObfusctor().encode(5);
  t.ok(obfuscatedId);
  let originalId = IdObfusctor().decode(obfuscatedId);
  t.equals(id, originalId);
  t.end();
});
