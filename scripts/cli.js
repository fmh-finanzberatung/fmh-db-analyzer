const log = require('mk-log');
const readline = require('readline');
const colours = require('../lib/utils/colours.js')();

function createAdminUser(rl) {
  console.log('Implement createAdminUser');
}

function setupMenu(rl) {
  log.info('setupMenu');
  const menuItems = [
    {
      label: 'Create Admin User',
      selector: 'c',
      fn: () => createAdminUser(rl),
    },
    {
      label: 'Exit',
      selector: 'e',
      fn: function exit() {
        return;
      },
    },
  ];
  return menuItems;
}

function mainMenu(rl) {
  return [
    {
      label: 'Setup',
      selector: 's',
      fn: () => menuOptions(rl, setupMenu(rl)),
    },
    {
      label: 'Exit',
      selector: 'e',
      fn: function exit(rl) {
        rl.close();
      },
    },
  ];
}

function menuOptions(rl, menuItems) {
  const options = menuItems
    .map((item) => {
      return item.label.replace(
        new RegExp(item.selector, 'i'),
        (c) => `(${c})`
      );
    })
    .join(' | ') + ': ';
  rl.question(options, (answer) => {
    log.info('answer', answer);
    const item = menuItems.find((item) => item.selector === answer);
    console.log('item ' + JSON.stringify(item));
    if (item) {
      item.fn(rl);
    } else {
      console.log(`${answer} is not a valid option.`);
      menuOptions(rl, menuItems);
    }
  });
}

function cli() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  menuOptions(rl, mainMenu(rl));

  rl.on('close', function () {
    console.log('\nBYE BYE !!!');
    process.exit(0);
  });
}

cli();
