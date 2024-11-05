import log from 'mk-log';
import createSeed from './create.js';

async function main() {
  try {
    const result = await createSeed();
    log.info(result.data);
    process.exit(0);
  } catch (err) {
    log.error(err);
  }
}

main();
