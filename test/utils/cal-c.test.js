const tape = require('tape');
const CalC = require('../../lib/utils/cal-c.js');
const log = require('mk-log');

tape('minutes from now', (t) => {
  // const now = new Date();
  const minutes = CalC(2).minutes;
  log.info('minutes', minutes);

  log.info('minutes.sinceNow ', minutes.since().date);
  log.info('now              ', new Date());
  log.info('minutes.beforeNow', minutes.before().date);
  log.info('-----------------');
  const hours = CalC(2).hours;
  log.info('hours.sinceNow   ', hours.since().date);
  log.info('now              ', new Date());
  log.info('hours.beforeNow  ', hours.before().date);
  log.info('-----------------');
  const days = CalC(2).days;
  log.info('days.sinceNow    ', days.since().date);
  log.info('now              ', new Date());
  log.info('days.beforeNow   ', days.before().date);
  log.info('-----------------');
  const weeks = CalC(2).weeks;
  log.info('weeks.sinceNow   ', weeks.since().date);
  log.info('now              ', new Date());
  log.info('weeks.beforeNow  ', weeks.before().date);
  log.info('-----------------');
  const months = CalC(2).months;
  log.info('months.sinceNow  ', months.since().date);
  log.info('now              ', new Date());
  log.info('months.beforeNow ', months.before().date);
  log.info('-----------------');
  const years = CalC(2).years;
  t.equal(
    years.since().isGreaterThan(new Date(2027, 11)),
    true,
    'now greater than bigger date'
  );
  t.equal(
    years.since().isGreaterThan(new Date(2002, 0)),
    false,
    'now is not greater than smaller date'
  );
  t.equal(
    years.since().isSmallerThan(new Date(2027, 11)),
    true,
    'smaller than'
  );
  t.equal(
    years.since().isSmallerThan(new Date(2002, 0)),
    false,
    'smaller than'
  );

  log.info('years.sinceNow   ', years.since().date);
  log.info('now              ', new Date());
  log.info('years.beforeNow  ', years.before().date);
  t.end();
});
