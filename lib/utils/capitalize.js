module.exports = function capitalize(snakeOrKebap) {
  return `${snakeOrKebap}`
    .split(/_|-/)
    .map((s) => s.replace(/^./, (l) => l.toUpperCase()))
    .join('');
};
