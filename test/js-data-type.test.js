const tape = require('tape');
const JsDataType = require('../lib/utils/js-data-type');

tape((t) => {
  const zeroFloatDataType = JsDataType(3.0);
  t.ok(zeroFloatDataType.isInteger(1));
  const floatDataType = JsDataType(3.1);
  t.ok(floatDataType.isFloat());
  const stringDataType = JsDataType('test');
  t.ok(stringDataType.isString());
  const arrayDataType = JsDataType(['a', 'b', 'c']);
  t.ok(arrayDataType.isArray());
  const objectDataType = JsDataType({ a: 'A', b: 'B' });
  t.ok(objectDataType.isObject());
  t.end();
});
