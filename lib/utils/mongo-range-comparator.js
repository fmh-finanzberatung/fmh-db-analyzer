module.exports = function MysqlRangeComparator(fieldName) {
  let s = fieldName;

  const pub = {
    greater(intervalType) {
      s = s += ' >';
      if (intervalType === 'CLOSED') {
        s += `= `;
      }
      return `${s} ? `;
    },
    smaller(intervalType) {
      s = s += ' <';
      if (intervalType === 'CLOSED') {
        s += `= `;
      }
      return `${s} ? `;
    },
  };

  return pub;
};
