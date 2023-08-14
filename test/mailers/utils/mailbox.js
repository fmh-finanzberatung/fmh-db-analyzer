const CalC = require('../../../lib/utils/cal-c.js');
const { simpleParser } = require('mailparser');
const { ImapFlow } = require('imapflow');
const pino = require('pino')();
const log = require('mk-log');

module.exports = async function Mailbox(imapOptionArgs, optionArgs = {}) {
  const options = Object.assign(
    {},
    { logLevel: 'silent', matchString: '--test--' },
    optionArgs
  );

  pino.level = options.logLevel;
  const imapOptions = Object.assign({}, imapOptionArgs, {
    logger: pino,
  });
  const client = new ImapFlow(imapOptions);
  await client.connect();
  const lock = await client.getMailboxLock('INBOX');
  const messages = await client.search({
    //envelope: true,
    since: CalC(1).days.before().date,
    subject: options.matchString, //'--test--',
    //from: 'register@galt.de',
  }); //{
  const mailRange = messages.join(',');
  const mailRangeFirst = `${messages[0]}`;

  const pub = {
    hasMessages() {
      return messages.length > 0;
    },
    async forEach(cb) {
      for await (let msg of client.fetch(mailRange, {
        envelope: true,
        source: true,
      })) {
        const { envelope, source } = msg;
        const parsed = await simpleParser(source);
        cb(parsed, envelope, source);
      }
    },
    count() {
      return messages.length;
    },
    get fetch() {
      return {
        async all(optionArgs) {
          const options = Object.assign(
            {},
            { uid: true },
            optionArgs
          );
          const result = [];
          for await (let msg of client.fetch(mailRange, options)){
            console.log('msg.uid', msg.uid);
            result.push(msg);
          }
          return result;
        },
        async one() {
          log.info('mailRange', mailRange);
          const foundResult = await client.fetchOne(mailRange, {
            envelope: true,
            source: true,
          });

          log.info('foundResult', foundResult);
          // found this example with mailparser here:
          // https://githubhot.com/repo/andris9/imapflow/issues/46
          const rawSource = foundResult.source.toString('utf8');
          const parsedContent = await simpleParser(rawSource);
          return parsedContent;
        },
      };
    },
    get delete() {
      return {
        async all() {
          const deleteResult = await client.messageDelete(mailRange);
          return deleteResult;
        },
        async one() {
          const deleteResult = await client.messageDelete(mailRangeFirst);
          return deleteResult;
        },
      };
    },
    release() {
      return lock.release();
    },
  };

  return pub;
};
