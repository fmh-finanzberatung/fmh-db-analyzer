const ensureTwoDigits = require('./ensure-two-digits.js');

module.exports = function buildDateString(dateTimeObj) {
  const dateFieldNames = ['year', 'month', 'date'];
  const timeFieldNames = ['hour', 'minute', 'second'];
  const dateFields = dateFieldNames.reduce((dateFields, dateFieldName) => {
    let val = dateTimeObj[dateFieldName];
    if (val) {
      if (dateFieldName.match(/month|date/)) {
        val = ensureTwoDigits(val);
      }
      dateFields.push(val);
    } else {
      dateFields.push('00');
    }
    return dateFields;
  }, []);
  const timeFields = timeFieldNames.reduce((timeFields, timeFieldName) => {
    let val = dateTimeObj[timeFieldName];
    if (val) {
      if (timeFieldName.match(/hour|second/)) {
        val = ensureTwoDigits(val);
      }
      timeFields.push(val);
    } else {
      timeFields.push('00');
    }
    return timeFields;
  }, []);
  return `${dateFields.join('-')} ${timeFields.join(':')}`;
};
