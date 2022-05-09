const BORDER_TYPE_SINGLE = 'single';
const BORDER_TYPE_DOUBLE = 'double';

module.exports = {
  Const: {
    BORDER_TYPE_SINGLE,
    BORDER_TYPE_DOUBLE,
  },
  [BORDER_TYPE_SINGLE]: {
    top: {
      split: '┬',
      left: '┌',
      right: '┐',
    },
    bottom: {
      left: '└',
      right: '┘',
      split: '┴',
    },
    left: {
      split: '├',
    },
    right: {
      split: '┤',
    },
    hor: {
      stroke: '─',
    },
    ver: {
      stroke: '│',
    },
    cross: '┼',
  },
  [BORDER_TYPE_DOUBLE]: {
    top: {
      split: '╦',
      left: '╔',
      right: '╗',
    },
    bottom: {
      left: '╚',
      right: '╝',
      split: '╩',
    },
    left: {
      split: '╠',
    },
    right: {
      split: '╣',
    },
    hor: {
      stroke: '═',
    },
    ver: {
      stroke: '║',
    },
    cross: '╬',
  },
};

