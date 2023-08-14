const log = require('mk-log');

function from(ms, date = Date.now()) {
  return new Date(date - ms);
}

function ensureDateNumber(date) {
  log.info('date', date);
  if (typeof date === 'number') {
    return date;
  }
  if (date instanceof Date) {
    return date.getTime();
  }
  if (typeof date === 'string') {
    return new Date(date).getTime();
  }
  throw new Error(
    'date is not a valid date. Must be either of type number Date or string but was ',
    date
  );
}

function greaterThan(ms, date = Date.now(), dateCompare = Date.now()) {
  const ensuredDateNumber = ensureDateNumber(date);
  const ensuredDateCompareNumber = ensureDateNumber(dateCompare);
  const result = ensuredDateNumber + ms < ensuredDateCompareNumber;
  return result;
}

function smallerThan(ms, date = Date.now(), dateCompare = Date.now()) {
  const ensuredDateNumber = ensureDateNumber(date);
  log.info('dateCompare    ', dateCompare);
  const ensuredDateCompareNumber = ensureDateNumber(dateCompare);
  return ensuredDateNumber + ms < ensuredDateCompareNumber;
}

function timeUnitFactory(timeUnit, context, number) {
  return {
    since(dateSince) {
      return {
        get date() {
          return from(context[`${timeUnit}ToMs`](-1 * number), dateSince);
        },
        isSmallerThan(dateCompare) {
          return smallerThan(
            context[`${timeUnit}ToMs`](number),
            dateSince,
            dateCompare
          );
        },
        isGreaterThan(dateCompare) {
          return greaterThan(
            context[`${timeUnit}ToMs`](number),
            dateSince,
            dateCompare
          );
        },
      };
    },
    before(dateBefore) {
      return {
        get date() {
          return from(context[`${timeUnit}ToMs`](number), dateBefore);
        },
        isSmallerThan(dateCompare) {
          return smallerThan(
            context[`${timeUnit}ToMs`](number),
            dateBefore,
            dateCompare
          );
        },
        isGreaterThan(dateCompare) {
          return greaterThan(
            context[`${timeUnit}ToMs`](number),
            dateBefore,
            dateCompare
          );
        },
      };
    },
  };
}

module.exports = function CalC(number) {
  const pub = {
    minutesToMs(number) {
      return number * 60 * 1000;
    },

    hoursToMs(number) {
      return number * pub.minutesToMs(60);
    },

    daysToMs(number) {
      return number * pub.hoursToMs(24);
    },

    weeksToMs(number) {
      return number * pub.daysToMs(7);
    },

    // month as 30 days
    monthsToMs(number) {
      return number * pub.daysToMs(30);
    },

    // month as 365 days
    yearsToMs(number) {
      return number * pub.daysToMs(365);
    },
    get minutes() {
      return timeUnitFactory('minutes', pub, number);
    },
    get hours() {
      return timeUnitFactory('hours', pub, number);
    },
    get days() {
      return timeUnitFactory('days', pub, number);
    },
    get weeks() {
      return timeUnitFactory('weeks', pub, number);
    },
    get months() {
      return timeUnitFactory('months', pub, number);
    },
    get years() {
      return timeUnitFactory('years', pub, number);
    },
  };
  return pub;
};
