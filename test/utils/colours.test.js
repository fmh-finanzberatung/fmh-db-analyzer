const tape = require('tape');
const Colours = require('../../lib/utils/colours.js');
const log = require('mk-log');

async function wait(timeout = 500, cb) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (cb) {
        cb();
      }
      resolve();
    }, timeout);
  });
}

async function main() {
  await tape('16 colours', async (t) => {
    try {
      const coloursA = Colours();

      coloursA.bg.red.fg.bright.white;
      coloursA.cr.out('test out').cr;
      coloursA.out('once more').cr;

      const coloursB = Colours();

      coloursB.bg.blue.fg.bright.yellow;
      coloursB.cr.out('test out').cr;
      coloursB.out('once more').cr;

      coloursA.out('Did it change?').cr;
      t.ok(true);
    } catch (e) {
      log.error(e);
    } finally {
      t.end();
    }
  });
  await tape('extended colours', async (t) => {
    try {
      const colours = Colours();
      colours.fg.bright.white.cr;
      const PER_ROW = 5;
      let countRowItems = 0;
      for (let i = 16, l = 255; i <= l; i++) {
        colours.bg.extCol(i).out(` ${i} `);
        if (countRowItems !== 0 && countRowItems % PER_ROW === 0) {
          colours.cr;
          countRowItems = 0; 
        } else {
          countRowItems += 1; 
        }
      }
      t.ok(true);
    } catch (e) {
      log.error(e);
    } finally {
      t.end();
    }
  });
}

main();
