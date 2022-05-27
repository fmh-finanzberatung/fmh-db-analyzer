const log = require('mk-log');
const ensureTruncate = require('./ensure-truncate.js').ensureTruncate;
// const ellipsis = '…';

// wrapper to allow maxWidth arg
function paragraphReducer(maxWidth) {
  // thunk
  return (paragraphs, p) => {
    const words = p.split(/ /gm);
    const lines = [];
    let currentLine = '';
    for (let i = 0, l = words.length; i < l; i++) {
      const word = words[i];
      const ellipsizedWord = ensureTruncate(word, { maxWidth });
      let space = '';
      if (currentLine.length > 0) {
        space = ' ';
      }
      if (
        currentLine.length + space.length + ellipsizedWord.length >
        maxWidth
      ) {
        lines.push(`${currentLine}`);
        currentLine = ellipsizedWord;
      } else {
        currentLine += `${space}${ellipsizedWord}`;
      }
    }
    if (currentLine) {
      lines.push(`${currentLine}`);
    }
    paragraphs.push(lines);
    return paragraphs;
  };
}

module.exports = function wrapText(newS, newOptions = {}) {
  const options = Object.assign({}, { maxWidth: 80 }, newOptions);
  
  const s = newS || '';
  const paragraphs = s.split(/\n+/gm);
  //lines.forEach(function)
  const adjustedParagraphs = paragraphs.reduce(
    paragraphReducer(options.maxWidth),
    []
  );

  return {
    count: adjustedParagraphs.length,
    paragraphs: adjustedParagraphs,
    text: adjustedParagraphs.map((p) => p.join('\n')).join('\n'),
  };
};
