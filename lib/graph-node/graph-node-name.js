import pluralize from 'pluralize';

export default function graphNodeName(tableName) {
  return pluralize.singular(tableName);
};
