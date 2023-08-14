const tape = require('tape');
//const log = require('mk-log');
const PluginManager = require('../../lib/utils/plugin-manager.js');

tape('plugin manager exec', async (test) => {
  const pluginManager = PluginManager('test/mockups');
  pluginManager.addPluginConfigOptions('mockup', { name: 'test'});
  test.test('call exec', (t) => {  
    pluginManager.exec((_plugin) => {
      t.pass('should call forEach');
    });
    t.end();
  });

  test.test(async (t) => {
    const result = {};
    const query = (s) => {
      result['s'] = s;
    };

    pluginManager.exec({ txt: 's', query });

    t.ok(result.s, 'should provide result string');

    t.end();
  });
  test.end();
});

tape(async (t) => {
  const result = {};
  const pluginManager = PluginManager('test/mockups');
  pluginManager.addPluginConfigOptions('mockup', { name: 'test'});
  const query = (s) => {
    result['s'] = s;
  };

  pluginManager.exec({ txt: 's', query });

  t.ok(result.s, 'should provide result string');

  t.end();
});
