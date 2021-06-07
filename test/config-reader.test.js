const tape = require('tape');
const log = require('mk-log');
const ConfigReader = require('../lib/utils/config-reader.js');

async function main() {
  await tape(async (t) => {
    const configReader = await ConfigReader('not-there.js');

    log.info('configReader', configReader.insecure());

    t.ok(configReader.insecure().match('Security Warning'));
    t.end();
  });
  await tape(async (t) => {
    const configReader = await ConfigReader();

    t.notOk(
      configReader.node('Person').query().public().denied(),
      'should be allowed'
    );
    t.ok(
      configReader.node('Person').query().public().field('created_at').denied(),
      'should be denied'
    );
    t.ok(
      configReader.node('Person').query().public().field('created_at').denied(),
      'should be denied'
    );

    t.end();
  });
}

main();
