function buildSectionArgs(argsObj) {
  if (!argsObj || !Object.keys(argsObj).length) {
    return '';
  } 
  const sectionArgs =  Object.keys(argsObj).map(key => {
    const value = argsObj[key];
    return `${key}: ${value}`;
  }).join(' ');
  return `{ ${sectionArgs} }`;
  
}

export default function buildQueryArgs(argsObj) {
  if (!argsObj || !Object.keys(argsObj).length) {
    return '';
  } 

  const querySections =  Object.keys(argsObj).map(key => {
    const value = argsObj[key];
    console.log(`querySection ${key}`, value);
    const sectionArgs = buildSectionArgs(value); 
    return sectionArgs ? `${key}: ${sectionArgs}` : ''; 
  }).join(' ');

  console.log('querySections', querySections);

  return `( ${querySections} )`;

}
