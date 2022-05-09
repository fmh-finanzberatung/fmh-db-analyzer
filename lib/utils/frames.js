const log = require('mk-log');
const { AlignText, Const } = require('./align-text.js');
const Colours = require('./colours.js');
const BorderDefs =  require('./frames/border-defs.js'); 
const BORDER_TYPE_SINGLE = 'single';
const BORDER_TYPE_DOUBLE = 'double';

// each column width is adjusted
// to the max width of the column's
// content
const COL_WIDTH_TYPE_RATIO = 'ratio';
// each column takes its full space
const COL_WIDTH_TYPE_ABSOLUTE = 'absolute';

function joinSections(data) {
  const keys = Object.keys(data);
  return keys.reduce((resultList, key) => {
    return resultList.concat(data[key]);
  }, []);
}

function analyzeContentMetrics(data, options) {
  // create single table from multiple table sections
  const joinedSections = joinSections(data);

  // find the max of the colums
  const colsCount = joinedSections.reduce((max, row) => {
    return Math.max(max, row.length);
  }, 0);
  log.info('colsCount', colsCount);

  // create an array which should hold the max
  // widths of each column identified by its
  // index in the row
  const foundColWidths = Array(colsCount).fill(0);

  // Of each column find the max value
  // and assign it at the col's array
  joinedSections.reduce((colWidths, row) => {
    row.forEach((cell, cellIndex) => {
      const cellContent = `${cell}`;
      colWidths[cellIndex] = Math.max(colWidths[cellIndex], cellContent.length);
    });
    return colWidths;
  }, foundColWidths);

  const borderElementsLength = colsCount + 1;
  const paddingElementsLength = options.padding * colsCount;
  //const availableContentSpace =
  //  options.maxWidth - borderElementsLength - paddingElementsLength;

  let maxContentWidths = [];

  if (options.colWidthType === COL_WIDTH_TYPE_ABSOLUTE) {
    // absolute: use actual col widths
    maxContentWidths = foundColWidths;
  } else if (options.colWidthType === COL_WIDTH_TYPE_RATIO) {
    const originalContentWidth = foundColWidths.reduce((sum, colWidth) => {
      return sum + colWidth;
    }, 0);

    // fullwidth: content with border and padding
    const originalFullWidth =
      originalContentWidth + borderElementsLength + paddingElementsLength;

    const availableRatioContentSpace =
      options.maxWidth - borderElementsLength + paddingElementsLength;
  }

  const totalContentWidth = maxContentWidths.reduce(
    (sum, width) => sum + width,
    0
  );

  return {
    maxContentWidths,
    totalContentWidth,
  };
}

function buildLine({
  sectionKey,
  rowIndex,
  sectionData,
  maxColWidthsByCol,
  hooks,
}) {
  return (cell, cellIndex) => {
    const maxColWidth = maxColWidthsByCol[cellIndex];
    const adjustedWidthContent = AlignText(cell, {
      width: maxColWidth,
    }).getSingleLine();
    const beforeCell = hooks[sectionKey].beforeCell({ cell, cellIndex }) || '';
    const afterCell = hooks[sectionKey].afterCell({ cell, cellIndex }) || '';
    const paddedCell = `${beforeCell}${adjustedWidthContent}${afterCell}`;

    const resultCell = hooks[sectionKey].cell({ cell: paddedCell, cellIndex, rowIndex });

    return resultCell;
  };
}

function buildSection({ data, options, hooks }) {
  return (key) => {
    const { totalContentWidth, maxColWidthsByCol } = options;
    const sectionData = data[key];
    const betweenCells = hooks[key].betweenCells() || '';
    const betweenRows = hooks[key].betweenRows() || '';
    const beforeRow = hooks[key].beforeRow() || '';
    const afterRow = hooks[key].afterRow() || '';
    const joinedSectionData = sectionData
      .map((row, rowIndex) => {
        const joinedCells = row
          .map(
            buildLine({
              sectionKey: key,
              rowIndex,
              sectionData,
              maxColWidthsByCol,
              hooks,
            })
          )
          .join(betweenCells);
        return `${beforeRow}${joinedCells}${afterRow}\n\r`;
      })
      .join(`\n\r${betweenRows}\n\r`);
    const beforeSection =
      hooks[key].beforeSection({
        totalContentWidth,
        maxColWidthsByCol,
      }) || '';
    const afterSection =
      hooks[key].afterSection({
        totalContentWidth,
        maxColWidthsByCol,
      }) || '';
    return `\n\r${beforeSection}\n\r${joinedSectionData}\n\r${afterSection}`;
  };
}

function buildTable(data, newOptions, hooks) {
  const { maxContentWidths, totalContentWidth } = analyzeContentMetrics(
    data,
    newOptions
  );
  const keys = Object.keys(data);
  log.info('maxContentWidths', maxContentWidths);
  const options = Object.assign({}, newOptions, {
    maxColWidthsByCol: maxContentWidths,
    totalContentWidth,
  });
  const result = keys.map(buildSection({ data, options, hooks })).join('\n\r');
  return result;
}

function defaultHooks(newOptions, colourScheme) {
  const options = Object.assign(
    {},
    { padding: 0, borderType: BorderDefs.Const.BORDER_TYPE_SINGLE },
    newOptions
  );
  const paddingSpace = ' '.repeat(options.padding);

  return {
    beforeSection: ({ totalContentWidth, maxColWidthsByCol }) => {
      for (let i = 0, l = maxColWidthsByCol.length; i < l; i++) {
        const colWidth = maxColWidthsByCol[i];
      }
      const inner = maxColWidthsByCol
        .map(
          (width) =>
            `${BorderDefs[options.borderType].hor.stroke}`.repeat(width) +
            `${BorderDefs[options.borderType].hor.stroke}`.repeat(
              options.padding * 2
            )
        )
        .join(BorderDefs[options.borderType].top.split);
      const outer =
        BorderDefs[options.borderType].top.left +
        inner +
        BorderDefs[options.borderType].top.right;
      //log.info('totalContentWidth', totalContentWidth);

      return colourScheme.border.build(outer);
      //return '.'.repeat(totalContentWidth);
    },
    beforeCell: () => paddingSpace,
    cell: ({ cell, rowIndex }) => {
      const cellColour =
        (rowIndex % 2 ? colourScheme?.cell?.even : colourScheme?.cell?.odd) ||
        colourScheme.cell;
      return cellColour.build(cell);
    },
    afterCell: () => paddingSpace,
    beforeRow: () => {
      const stroke = BorderDefs[options.borderType].ver.stroke;
      return colourScheme.border.build(stroke);
    },
    afterRow: () => {
      const stroke = BorderDefs[options.borderType].ver.stroke;
      return colourScheme.border.build(stroke);
    },
    afterSection: ({ totalContentWidth, maxColWidthsByCol }) => {
      const inner = maxColWidthsByCol
        .map(
          (width) =>
            `${BorderDefs[options.borderType].hor.stroke}`.repeat(width) +
            `${BorderDefs[options.borderType].hor.stroke}`.repeat(
              options.padding * 2
            )
        )
        .join(BorderDefs[options.borderType].bottom.split);
      const outer =
        BorderDefs[options.borderType].bottom.left +
        inner +
        BorderDefs[options.borderType].bottom.right;
      //log.info('totalContentWidth', totalContentWidth);

      return colourScheme.border.build(outer);
      //return '.'.repeat(totalContentWidth);
    },
    betweenCells: () => {
      const stroke = BorderDefs[options.borderType].ver.stroke;
      return colourScheme.border.build(stroke);
    },
    betweenRows: () => {},
  };
}

function Frames(newData = {}, newOptions = {}, newColorScheme = {}) {
  const options = Object.assign(
    {},
    {
      borderType: BorderDefs.Const.BORDER_TYPE_SINGLE,
      colWidthType: COL_WIDTH_TYPE_RATIO,
      padding: 0,
      maxWidth: 80,
    },
    newOptions
  );

  const colorScheme = Object.assign(
    {},
    {
      border: Colours().bg.extCol(17).bright.fg.extCol(39),
      cell: {
        odd: Colours().bg.extCol(18).bright.fg.extCol(51),
        even: Colours().bg.extCol(19).bright.fg.extCol(51),
      },
    },
    newColorScheme
  );

  let data = newData;
  return {
    build(newHooks = {}) {
      const hooks = Object.assign(
        {},
        {
          header: defaultHooks(options, colorScheme),
          body: defaultHooks(options, colorScheme),
          footer: defaultHooks(options, colorScheme),
        },
        newHooks
      );
      return buildTable(data, options, hooks);
    },
  };
}

module.exports = {
  Frames,
  Const: {
    BORDER_TYPE_SINGLE: BorderDefs.Const.BORDER_TYPE_SINGLE,
    BORDER_TYPE_DOUBLE: BorderDefs.Const.BORDER_TYPE_DOUBLE,
    COL_WIDTH_TYPE_ABSOLUTE,
    COL_WIDTH_TYPE_RATIO,
  }, // Const is AlignText Const
  defaultHooks,
};
