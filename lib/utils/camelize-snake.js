module.exports = function camelizeSnake(snake) {
  return `${snake}`
    .split('_')
    .map((s, i) => {
      const lCase = s.toLowerCase();
      if (i === 0) return lCase;
      return lCase.replace(/^./, (l) => l.toUpperCase());
    })
    .join('');
};
