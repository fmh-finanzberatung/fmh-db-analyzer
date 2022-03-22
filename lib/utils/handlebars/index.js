const Handlebars = require('handlebars');
const fs = require('fs').promises;
const helpers = require('./helpers'); 
// const log = require('mk-log');
const path = require('path');

Handlebars.registerHelper(helpers);

module.exports = async function renderHbs(templatePath, data) {

  const viewPath = path.resolve(path.join(`lib/mailers`, templatePath));
  const rawTemplate = await fs.readFile(viewPath, 'utf8'); 
  const template = Handlebars.compile(rawTemplate);
  const replacedText = template(data);
  return replacedText;

};


