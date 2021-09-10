module.exports = function buildOrderArgs(args, fn) {
  if (!args.order) return false;
  for (let key in args.order) {
    const fieldName = key;
    const order = args.order[key];
    fn(fieldName, order);
  }
};
