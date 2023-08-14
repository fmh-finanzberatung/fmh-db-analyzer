const tape = require('tape');
const RegistrationMailer = require('../../lib/mailers/registration.mailer.js');
const nodeMailer = require('nodemailer');
const { simpleParser } = require('mailparser');
const transportOptions =
  require('../../config/env/test-config.js').transportOptions;
const transport = nodeMailer.createTransport(transportOptions);
// pino is imapflow's logger
// it's turned on by default
const pino = require('pino')();
const { ImapFlow } = require('imapflow');
const config = require('../../config/env/test-config.js');
const log = require('mk-log');
const CalC = require('../../lib/utils/cal-c.js');

// regarding IMAP search
// it's not precise
// https://github.com/postalsys/imapflow/issues/25#issuecomment-679381183

function daysFrom(date, options = { days: -1 }) {
  const clonedDate = new Date(date.getTime());
  clonedDate.setDate(clonedDate.getDate() + options.days);
  return clonedDate;
}

async function main() {
  await tape('registration mail', async (test) => {
    let sentAt = new Date();

    await test.test('send mail with confirm token', async (t) => {
      try {
        const registrationMailer = RegistrationMailer(transport);
        sentAt = new Date();
        const result = await registrationMailer.sendConfirmRegistration({
          // only avaialable in test config
          siteName: config.siteName,
          email: config.registration.user.email,
          registrationHost: config.registration.host,
          replyTo: config.registration.replyTo,
          subject: 'galt.de --test-- Registrierung bestätigen',
          link: `${config.registration.url}/token`,
        });
        t.ok(result, 'mail was sent');
      } catch (err) {
        log.error(err);
        t.fail(err);
      } finally {
        t.end();
      }
    });
   
    await test.test('successful registration confirm mail', async (t) => {
      let lock;
      try {
        pino.level = 'silent';
        const imapOptions = Object.assign({}, config.imapOptions, {
          logger: pino,
        });
        const client = new ImapFlow(imapOptions);
        await client.connect();

        // Select and lock a mailbox. Throws if mailbox does not exist
        lock = await client.getMailboxLock('INBOX');

        const messages = await client.search({
          //envelope: true,
          since: CalC(1).days.before().date,
          subject: '--test--',
          //from: 'register@galt.de',
        }); //{

        t.ok(messages.length > 0, 'found messages');
        // : separates range(s)
        // , separates single records
        const mailRange = messages.join(',');

        const foundResult = await client.fetchOne(mailRange, {
          envelope: true,
          source: true,
        });

        // found this example with mailparser here:
        // https://githubhot.com/repo/andris9/imapflow/issues/46
        const rawSource = foundResult.source.toString('utf8');
        const parsedContent = await simpleParser(rawSource);

        log.info('parsedContent.text', parsedContent.text);

        t.ok(parsedContent.text.match(/token/), 'found token link');
        const deleteResult = await client.messageDelete(mailRange);

        t.ok(deleteResult, 'mail was deleted');
        // logout and close connection
        await client.logout();
      } catch (e) {
        log.error(e);
        t.fail(e);
      } finally {
        // Make sure lock is released, otherwise next `getMailboxLock()` never returns
        lock.release();
        t.end();
      }
    });
    
    await test.test('send mail with completed message', async (t) => {
      try {
        const registrationMailer = RegistrationMailer(transport);
        sentAt = new Date();
        const result = await registrationMailer.sendCompletedRegistration({
          // only avaialable in test config
          email: config.registration.user.email,
          siteName: config.siteName,
          replyTo: config.registration.replyTo,
          loginUrl: config.login.url,
          subject: 'galt.de --test-- Willkommen',
        });
        t.ok(result, 'mail was sent');
      } catch (err) {
        log.error(err);
        t.fail(err);
      } finally {
        t.end();
      }
    });

    await test.test('successful registration completed mail', async (t) => {
      let lock;
      try {
        pino.level = 'silent';
        const imapOptions = Object.assign({}, config.imapOptions, {
          logger: pino,
        });
        const client = new ImapFlow(imapOptions);
        await client.connect();

        // Select and lock a mailbox. Throws if mailbox does not exist
        lock = await client.getMailboxLock('INBOX');
        // fetch latest message source
        // client.mailbox includes information about currently selected mailbox

        const yesterday = daysFrom(sentAt, { days: -1 });

        const messages = await client.search({
          //envelope: true,
          since: yesterday,
          subject: '--test--',
          //from: 'register@galt.de',
        }); //{

        t.ok(messages.length > 0, 'found messages');
        // : separates range(s)
        // , separates single records
        const mailRange = messages.join(',');

        const foundResult = await client.fetchOne(mailRange, {
          envelope: true,
          source: true,
        });

        // found this example with mailparser here:
        // https://githubhot.com/repo/andris9/imapflow/issues/46
        const rawSource = foundResult.source.toString('utf8');
        const parsedContent = await simpleParser(rawSource);

        log.info('parsedContent.text', parsedContent.text);

        t.ok(parsedContent.text.match(/Willkommen/), 'found token link');
        const deleteResult = await client.messageDelete(mailRange);

        t.ok(deleteResult, 'mail was deleted');
        // logout and close connection
        await client.logout();
      } catch (e) {
        log.error(e);
        t.fail(e);
      } finally {
        // Make sure lock is released, otherwise next `getMailboxLock()` never returns
        lock.release();
        t.end();
      }
    });

    test.end();
  });
}

main();
