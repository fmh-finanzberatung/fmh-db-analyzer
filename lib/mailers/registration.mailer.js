const log = require('mk-log');

const renderHbs = require('../utils/handlebars');

module.exports = function RegistrationMailer(transport) {
  return {
    async sendConfirmRegistration(data) {
      try {
        const templatePath = 'registration-confirm.txt.hbs';
        const mailText = await renderHbs(templatePath, { data });

        return await new Promise((resolve, reject) => {
          // setup email data with unicode symbols
          const mailOptions = {
            from: 'galt.de Registrierung <register@galt.de>',
            to: data.email,
            // cc: `${contact.email}`,
            replyTo: `${data.email}`,
            subject: data.subject,
            text: mailText,
          };

          transport.sendMail(mailOptions, (error, info) => {
            if (error) {
              log.error(error);
              return reject(error);
            }
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
        const templatePath = 'registration-completed.txt.hbs';
        const mailText = await renderHbs(templatePath, { data });
        return await new Promise((resolve, reject) => {
          // setup email data with unicode symbols
          const mailOptions = {
            from: 'galt.de Registrierung <register@galt.de>',
            to: data.email,
            // cc: `${contact.email}`,
            replyTo: `${data.replyTo}`,
            subject: 'galt.de --test-- Willkommen',
            text: mailText,
          };

          transport.sendMail(mailOptions, (error, info) => {
            if (error) {
              log.error(error);
              return reject(error);
            }
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
