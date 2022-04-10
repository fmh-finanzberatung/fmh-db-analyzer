const log = require('mk-log');
module.exports = function extractQsToken(text, optionArgs = {}) {
  const options = Object.assign({},
   optionArgs, 
    {
    tokenName: 'token',
    }
  );
  const regex = new RegExp(`http(s*):\\/\\/\\S*${options.tokenName}=(\\S*)`, 'm');
  const matchedText = text.match(regex);
  return matchedText?.[2];
};
