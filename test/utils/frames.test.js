const tape = require('tape');
const {Frames, Const} = require('../../lib/utils/frames.js');
const log = require('mk-log');

const PREFIX_TYPE_COUNT = 1;
const POSTFIX_TYPE_COUNT = 2;

function buildRow(content = '', newOptions = {}) {
  const options = Object.assign(
    {},
    {
      cols: 3,
      prefixType: 0,
      postfixType: 0,
    },
    newOptions
  );
  const row = [];
  for (let i = 0; i < options.cols; i++) {
    let prefix = '';
    let postfix = '';
    if (options.prefixType === PREFIX_TYPE_COUNT) {
      prefix = i;
    }
    if (options.postfixType === POSTFIX_TYPE_COUNT) {
      postfix = i;
    }
    row.push(`${prefix}${content}${postfix}`);
  }
  return row;
}

function buildTable(content = 0, rawOptions = {}) {
  const options = Object.assign(
    {},
    {
      rows: 1,
      cols: 3,
      prefixType: 0,
      postfixType: 0,
      rowContent: '',
      rowPrefixType: 0,
      rowPostfixType: 0,
    },
    rawOptions
  );
  const rows = [];
  for (let i = 0; i < options.rows; i++) {
    const row = buildRow(content, {
      cols: options.cols,
      prefixType: options.rowPrefixType,
      postfixType: options.rowPostfixType,
    });
    let prefix = '';
    let postfix = '';
    if (options.prefixType === PREFIX_TYPE_COUNT) {
      prefix = i;
    }
    if (options.postfixType === POSTFIX_TYPE_COUNT) {
      postfix = i;
    }
    row[0] = `${prefix}${row[0]}${postfix}`;

    rows.push(row);
  }
  return rows;
}

tape('main', (test) => {
  //const header = buildTable('h', { cols: 4 });
  const header = [['Meine Stadt', 'Meine Bank', 'Meine Katze', 'hmm']]; //
  //log.info(header);
  //const body = buildTable('body', { cols: 4,  rows: 3 });
  const body = [
    ['Frankfurt', 'Volksbank', 'Tiger', 'hmm'],
    ['Bern', 'Swiss Credit', '', 'hmm'],
  ]; //
  log.info(body);
  const footer = buildTable('footer', { cols: 4, rows: 3 });
  const data = { header, body, footer };
  test.test('absolute col widths single border', t => { 
    const framesAbs = Frames(data, {
      maxWidth: 80,
      colWidthType: Const.COL_WIDTH_TYPE_ABSOLUTE,
      borderType: Const.BORDER_TYPE_SINGLE,
    });
    const resultAbs = framesAbs.build();
    log.info(resultAbs);
    t.end();
  });
  test.test('absolute col widths double border', t => { 
    const framesAbs = Frames(data, {
      maxWidth: 80,
      colWidthType: Const.COL_WIDTH_TYPE_ABSOLUTE,
      borderType: Const.BORDER_TYPE_SINGLE,
      padding: 1,
    });
    const resultAbs = framesAbs.build();
    log.info(resultAbs);
    t.end();
  });
  /*
  const framesRatio = Frames(data, {
    maxWidth: 80,
    colWidthType: Const.COL_WIDTH_TYPE_RATIO,
  });
  const resultRatio = framesRatio.build();
  log.info(resultRatio);
  */
  test.end();
});
