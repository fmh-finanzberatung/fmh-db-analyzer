const tape = require('tape');
const log = require('mk-log');
const ScreenMetrics = require('../../lib/utils/screen-metrics.js');
const readline = require('readline');

function question({ rl, rows, cols }) {
  //const { rows, cols } = rl.getCursorPos();
  process.stdout.write('-'.repeat(cols));
  process.stdout.write('\n');
  rl.question(`@row ${rows}, @col ${cols} [q]uit? `, (answer) => {
    readline.cursorTo(process.stdout, 0);
    const relCursorPos = rl.getCursorPos();
    log.info('relCursorPos cols: ', relCursorPos.cols);
    log.info('relCursorPos rows: ', relCursorPos.rows);
    //log.info('rows', rows);
    //log.info('cols', cols);
    if (answer === 'q') {
      rl.close();
    } else if (answer === 'j') {
      rl.write('j pressed');
    } else {
      question(rl);
    }
  });
}

tape('screen metrics', (t) => {
  ScreenMetrics({
    onResize({ rl, rows, cols }) {
      log.info('onResize', rows, cols);
      question({ rl, rows, cols });
    },
    onClose() {
      log.info('onClose called');
      t.end();
      process.exit(0);
    },
  });

  //  t.end();
});
