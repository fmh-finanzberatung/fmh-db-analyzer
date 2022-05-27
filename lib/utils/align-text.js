const EnsureTruncate = require('./ensure-truncate.js');
const ensureTruncate = EnsureTruncate.ensureTruncate;
const EnsureTruncateConst = EnsureTruncate.Const; 
const centerText = require('./center-text.js');
const wrapText = require('./wrap-text.js');
const log = require('mk-log');

const ALIGN_TYPE_LEFT = 'left';
const ALIGN_TYPE_RIGHT = 'right';
const ALIGN_TYPE_CENTER = 'center';
const ALIGN_FILLER = ' ';

const Const = {
  ALIGN_TYPE_LEFT,
  ALIGN_TYPE_RIGHT,
  ALIGN_TYPE_CENTER,
};

function padAlign(sNew, newOptions = {}) {
  const options = Object.assign(
    {},
    { alignType: Const.ALIGN_TYPE_LEFT, width: 80 },
    newOptions
  );

  const ensuredMaxWordEllipsis = ensureTruncate(sNew, {
    maxWidth: options.width,
  });
  if (Object.values(Const).indexOf(options.alignType) === -1) {
    throw new Error(`Invalid align alignType: ${options.alignType}`);
  }
  if (options.alignType === ALIGN_TYPE_RIGHT) {
    return ensuredMaxWordEllipsis.padStart(options.width, ALIGN_FILLER);
  } else if (options.alignType === ALIGN_TYPE_CENTER) {
    return centerText(ensuredMaxWordEllipsis, options.width);
  }
  return ensuredMaxWordEllipsis.padEnd(options.width, ALIGN_FILLER);
}

module.exports = {
  AlignText(s, newCommonOptions) {
    const commonOptions = Object.assign(
      {},
      { width: 10, alignType: ALIGN_TYPE_LEFT },
      newCommonOptions
    );
    const availableWidth = commonOptions.width;

    return {
      getSingleLine() {
        const ensuredEllipsisText = ensureTruncate(s, {
          maxWidth: availableWidth,
        });
        return padAlign(ensuredEllipsisText, {
          alignType: commonOptions.alignType,
          width: availableWidth,
        });
      },
      getMultiLine(newOptions = {}) {
        const options = Object.assign({}, { maxLines: 5 }, newOptions);
        const wrappedText = wrapText(s, { maxWidth: commonOptions.width });
        const alignedText = [];
        let countLines = 0;
        for (let i = 0, l = wrappedText.paragraphs.length; i < l; i++) {
          if (options.maxLines > 0 && countLines >= 5) {
            break;
          }
          const alignedParagraph = [];
          const p = wrappedText.paragraphs[i];
          for (let j = 0, jl = p.length; j < jl; j++) {
            const line = p[j];
            const ensuredEllipsisText = ensureTruncate(line, {
              maxWidth: availableWidth,
            });
            const padAlignedText = padAlign(ensuredEllipsisText, {
              alignType: commonOptions.alignType,
              width: availableWidth,
            });
            countLines += 1;
            alignedParagraph.push(padAlignedText);
          }
          countLines += 1;
          alignedText.push(alignedParagraph);
        }
        wrappedText.alignedText = alignedText;
        return wrappedText;
      },
    };
  },
  Const,
};
