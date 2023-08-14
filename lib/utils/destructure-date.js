function ensureDate(date) {
  if (typeof date === 'number') {
    return new Date(date);
  }
  if (typeof date === 'string') {
    return new Date(date);
  }
  if (date instanceof Date) {
    return date;
  }
  throw new Error(
    'date is not a valid date. Must be either of type number Date or string but was ',
    date
  );
}

module.exports = function destructureDate(dateArg) {
  const date = ensureDate(dateArg);
  const dateObj = {
    raw: dateArg,
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    date: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    seconds: date.getSeconds(),
  };
  return dateObj;
};
