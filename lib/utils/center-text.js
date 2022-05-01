const log = require('mk-log');

module.exports = function centerText(text, width, newOptions = {}) {
  const options = Object.assign({}, { paddingChar: ' ' }, newOptions);

  if (text.length > width) {
    return text.substring(0, width);
  }

  const fullSpace = width - text.length; // Math.floor((width - text.length) / 2);
  let leftPadding = '';
  let rightPadding = '';

  if (fullSpace % 2 === 0) {
    //  even
    leftPadding = rightPadding = ' '.repeat(fullSpace / 2);
  } else {
    // odd
    const halfSpace = Math.floor(fullSpace / 2);
    leftPadding = options.paddingChar.repeat(halfSpace);
    rightPadding = leftPadding + options.paddingChar;
  }

  return leftPadding + text + rightPadding;
};
