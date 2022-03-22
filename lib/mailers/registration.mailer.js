const log = require('mk-log');

const renderHbs = require('../utils/handlebars');

module.exports = function RegistrationMailer(transport) {
  return {
    async sendConfirmRegistration(data) {
      try {
        log.info('data', data);
        const templatePath = 'registration-confirm.txt.hbs';
        const mailText = await renderHbs(templatePath, { data });

        log.info('mailText', mailText);

        return await new Promise((resolve, reject) => {
          // setup email data with unicode symbols
          const mailOptions = {
            from: 'galt.de Registrierung<register@galt.de>',
            to: data.email,
            // cc: `${contact.email}`,
            replyTo: `${data.email}`,
            subject: 'galt.de --test-- Registrierung bestätigen',
            text: mailText,
          };

          transport.sendMail(mailOptions, (error, info) => {
            if (error) {
              log.error(error);
              return reject(error);
            }
            log.info('info', info);
            return resolve(info);
          });
        });
      } catch (error) {
        log.error(error);
        return error;
      }
    },
    async sendCompletedRegistration(data) {
      try {
        const templatePath = 'contact-mailer/registration-confirm.txt.hbs';
        const mailText = await renderHbs(templatePath, { data });
        return await new Promise((resolve, reject) => {
          // setup email data with unicode symbols
          const mailOptions = {
            from: 'galt.de Registrierung <register@galt.de>',
            to: data.email,
            // cc: `${contact.email}`,
            replyTo: `${data.replyTo}`,
            subject: 'galt.de Willkommen',
            text: mailText,
          };

          transport.sendMail(mailOptions, (error, info) => {
            if (error) {
              log.error(error);
              return reject(error);
            }
            log.info(info);
            return resolve(info);
          });
        });
      } catch (error) {
        log.error(error);
        return error;
      }
    },
  };
};
