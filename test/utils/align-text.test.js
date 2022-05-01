const log = require('mk-log');
const tape = require('tape');
const { longLine } = require('../mockups/text.mockup.js');
const { AlignText, Const } = require('../../lib/utils/align-text.js');
const ellipsis = '…';

tape('align-text single line', (test) => {
  test.test('ellipsis', (t) => {
    const alignText = AlignText('hello world', {
      alignType: Const.ALIGN_TYPE_LEFT,
      width: 15,
    });
    const leftAlignedText = alignText.getSingleLine();
    log.info('leftAlignedText ', `"${leftAlignedText}"`);
    t.equal(leftAlignedText.length, 15, 'length 15');
    t.end();
  });

  test.test('align right', (t) => {
    const alignText = AlignText('hello world', {
      alignType: Const.ALIGN_TYPE_RIGHT,
      width: 20,
    });
    const rightAlignedText = alignText.getSingleLine();
    log.info('rightAlignedText ', rightAlignedText);
    t.equal(rightAlignedText.length, 20, 'length 20');
    t.equal(rightAlignedText, '         hello world', 'right');
    t.end();
  });
  test.test('align center', (t) => {
    const alignText = AlignText('hello world', {
      alignType: Const.ALIGN_TYPE_CENTER,
      width: 20,
    });
    const rightAlignedText = alignText.getSingleLine();
    log.info('rightAlignedText ', rightAlignedText);
    t.equal(rightAlignedText.length, 20, 'length 20');
    t.equal(rightAlignedText, '    hello world     ', 'centered');
    t.end();
  });
  test.end();
});

tape('align-text multi line', (test) => {
  test.test('ellipsis', (t) => {
    const alignText = AlignText(longLine, {
      alignType: Const.ALIGN_TYPE_LEFT,
      width: 20,
    });
    const leftAlignedText = alignText.getMultiLine();
    log.info('leftAlignedText ', leftAlignedText.alignedText);
    t.end();
  });

  test.test('align right', (t) => {
    const alignText = AlignText(longLine, {
      alignType: Const.ALIGN_TYPE_RIGHT,
      width: 20,
    });
    const rightAlignedText = alignText.getMultiLine();
    log.info('rightAlignedText ', rightAlignedText.alignedText);
    t.end();
  });

  test.test('align center', (t) => {
    const alignText = AlignText(longLine, {
      alignType: Const.ALIGN_TYPE_CENTER,
      width: 20,
    });
    const centerAlignedText = alignText.getMultiLine();
    log.info('centerAlignedText ', centerAlignedText.alignedText);
    t.end();
  });

  test.end();
});
