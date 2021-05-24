module.exports = function IdObfuscator(plus = 54, multiply = 7) {
  return {
    encode(num) {
      let modifiedNum = num * multiply + plus;
      return Buffer.from(`${modifiedNum}`).toString('base64');
    },
    decode(base64Str) {
      const s = Buffer.from(base64Str, 'base64').toString('ascii');
      const modifiedNum = parseInt(s);
      return (modifiedNum - plus) / multiply;
    },
  };
};
