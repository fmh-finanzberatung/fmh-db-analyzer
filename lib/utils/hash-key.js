import log from 'mk-log';
import crypto from 'crypto';

function HashKey(s, options = { salt: ''}) {
  if (!s) {
    throw new Error('A string must be provided!');
  }
  return {
    create() {
      if (!options.salt) {
        throw new Error('Hash salt must be provided!');
      }
      const md5 = crypto.createHash('md5');
      const result = md5.update(s + options.salt).digest('hex');
      return result;
    },
    validate (givenHash) {
      if (!givenHash) {
        throw new Error('A hash must be provided!');
      }
      const hash = this.create();
      return hash === givenHash;
    }
  };
}

export default HashKey;
