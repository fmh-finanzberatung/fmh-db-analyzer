import Handlebars from 'handlebars';
import faSync from 'fs';
const fs = faSync.promises;
import helpers from './helpers.js'; 
// const log = require('mk-log');
import path from 'path';

Handlebars.registerHelper(helpers);

export default async function renderHbs(templatePath, data) {

  const viewPath = path.resolve(path.join(`lib/mailers`, templatePath));
  const rawTemplate = await fs.readFile(viewPath, 'utf8'); 
  const template = Handlebars.compile(rawTemplate);
  const replacedText = template(data);
  return replacedText;

};


