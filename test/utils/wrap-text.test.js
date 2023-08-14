const log = require('mk-log');
const tape = require('tape');
const TextMockup = require('../mockups/text.mockup.js');
const wrapText =  require('../../lib/utils/wrap-text.js');

const localText = `This is a long text which describes
a very long and winding road`; 

tape('wrap text', (t) => {

  const lineWidth = 8;
  const result = wrapText(localText, { maxWidth: lineWidth });
  let maxLineLength = 0; 
  result.paragraphs.forEach(p => {
    p.forEach(line => {
      if (maxLineLength < line.length) {
        maxLineLength = line.length;
      }
    })
  });
  log.info('result text\n', result.text);

  t.ok(maxLineLength <= lineWidth, `line length <= ${lineWidth}`);
  t.end();
});
