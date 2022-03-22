const baseDigits = '0123456789';
const baseChars = 'abcdefghijklmnopqrstuvwxyz';
const baseCapitalChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function randomChar(chars) {
  const length = chars.length - 1;
  return chars[Math.floor(Math.random() * length)];
}

function randomChars(baseString, length) {
  let result = '';
  if (!length || length > baseString.length) {
    length = baseString.length;
  }

  for (let i = 0; i < length; i++) {
    result += randomChar(baseString);
  }
  return result;
}

module.exports = function RandomString(length = 8) {
  return {
    mixed() {
      const mixedCharSet = baseDigits + baseChars + baseCapitalChars;
      return randomChars(mixedCharSet, length);
    },
    chars() {
      const charsCharSet = baseChars + baseCapitalChars;
      return randomChars(charsCharSet, length);
    },
    capitalChars() {
      return randomChars(baseCapitalChars, length);
    },
    digits() {
      const baseCharSet = baseDigits;
      return randomChars(baseCharSet, length);
    },
  };
};
