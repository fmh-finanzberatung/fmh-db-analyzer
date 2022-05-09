const log = require('mk-log');
const readline = require('readline');
const termEsc = `\x1b[`; 

function pushCode(codes, code) {
  if (codes.indexOf(code) >= 0) return false;
  codes.push(code);
  return codes;
}


function Cursor() {
  const codes = []; 

  const pub = {
    get clear() {
      codes.splice(0);
      return pub; 
    },
    to(col, row) {
      pushCode(codes, `${row};${col}f`);
      return pub; 
    },
    up(rows)  {
      pushCode(codes, `${termEsc}${rows}A`);
      return pub; 
    },
    dn(rows) {
      pushCode(codes, `${termEsc}${rows}B`);
      return pub; 
    },
    fwd(cols) {
      pushCode(codes, `${termEsc}${cols}C`);
      return pub; 
    },
    bwd(cols) {
      pushCode(codes, `${termEsc};${cols}D`);
    },
    get del() {
      pushCode(codes, `${termEsc}K`);
      return pub;
    },
    get save() {
      pushCode(codes, `${termEsc}s`);
      return pub;
    },
    get restore() {
      pushCode(codes, `${termEsc}u`);
      return pub;
    },
  };
  return pub;
}


function ScreenMetrics(newOptions = {}) {
  log.info('newOptions', newOptions);
  const options = Object.assign(
    {},
    { onResize() {}, onClose() {} },
    newOptions
  );
  /*
  process.stdout.on('resize', () => {
    log.info('columns', process.stdout.columns);
    log.info('columns', process.stdout.rows);
  });
  */
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  log.info('onClose', options);

  rl.on('close', function () {
    rl.write('\nBYE BYE !!!');
    options.onClose();
  });

  //question(rl);

  process.stdout.on('resize', () => {
    log.info('columns', process.stdout.columns);
    log.info('rows   ', process.stdout.rows);
    options.onResize({
      rl,
      cols: process.stdout.columns,
      rows: process.stdout.rows,
    });
  });

  // fire on resize to bootstrap application
  options.onResize({
    rl,
    cols: process.stdout.columns,
    rows: process.stdout.rows,
  });

  return rl;
}

module.exports = ScreenMetrics;
