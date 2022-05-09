const tape = require('tape');
const Cursor = require('../../lib/utils/cursor.js');
const BorderDefs = require('../../lib/utils/frames/border-defs');
const log = require('mk-log');


//tape('test cursor', (t) => {

const cur = Cursor(process.stdin, process.stdout);

//cur.fill(3, 3, 31, 31, { char: 'X' });

//cur.fill(5, 5, 27, 27, { char: ' ' });
// cur.fill(0, 0, 9, 9, { char: ' ' });

/*
cur.border(3, 3, 31, 31, {
  char: '+',
  borderDefs: BorderDefs[BorderDefs.Const.BORDER_TYPE_SINGLE],
});
*/
//console.log('');
//process.stdout.write('\n');
//process.stdout.clearLine();

/*
cur.input(6, 6, 20, { prompt: 'Why?' } );
*/

cur.Select(6, 6, 20, { prompt: 'What?', label: 'Companies', list: [

  { value: 0, label: 'MacOS' },
  { value: 1, label: 'Windows' },
  { value: 2, label: 'Linux' },
  
], } ).select(1).focus();

//process.stdout.cursorTo(0);
process.stdout.write('\n');
//console.log('');
//cur.border(5, 5, 9, 9, {char: '+'});
//  t.end();
//});

//tape('test cursor', (t) => {
/*
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    //autoCommit: true, 
  });


  //readline.cursorTo(process.stdout,0, 0);
  readline.cursorTo(process.stdout, 0,0);
  readline.clearScreenDown(process.stdout);
 
  readline.cursorTo(process.stdout, 0, 4);
  rl.write('=================================\n');
 
  readline.cursorTo(process.stdout, 0, 5);
  rl.write('||                             ||\n');
  
  readline.cursorTo(process.stdout, 0, 6);
  rl.write('=================================\n');
 
  readline.cursorTo(process.stdout, 0, 7);
  rl.write('||                             ||\n');

  readline.cursorTo(process.stdout, 0, 8);
  rl.write('=================================\n');
  
  readline.cursorTo(process.stdout, 0, 9);
  rl.write('||                             ||\n');
  rl.write('=================================\n');

  readline.cursorTo(process.stdout, 3, 5);
  rl.write('Options: [m]ore [q]uit'); 

  readline.cursorTo(process.stdout, 3, 7);
  process.stdout.write('Choose: ');

  
  rl.on('close', () => {
    readline.cursorTo(process.stdout, 3, 9);
    rl.write(' BYE BYE !!!');
    readline.cursorTo(process.stdout, 0, 12);
    process.exit(0);
  });
  rl.on('error', (error) => {
    rl.write(error);
  });
  
  rl.on('line', (input) => {
     // readline.cursorTo(process.stdout, 3, 7);

    //console.log('input', input);

    const selected = input.replace(/\\n/, '').match(/.*(q|m)$/)?.[1]; 

    if (!selected) {
      readline.cursorTo(process.stdout, 3, 9);
      process.stdout.write('select provided option');
      //readline.cursorTo(process.stdout, 3, 9);
      //rl.prompt(); 
      //process.stdout.write(' [a]gain?: ');
      readline.cursorTo(process.stdout, 11, 7);
      process.stdout.write(' ');
      readline.cursorTo(process.stdout, 11, 7);
    }

    if (selected === 'q') {
      readline.cursorTo(process.stdout, 3, 9);
      process.stdout.write('You chose: ' + selected);
      rl.close();
    }
    
    if (selected === 'm') {
      readline.cursorTo(process.stdout, 3, 9);
      process.stdout.write('You chose: ' + selected);
      //readline.cursorTo(process.stdout, 3, 9);
      //rl.prompt(); 
      //process.stdout.write(' [a]gain?: ');
      readline.cursorTo(process.stdout, 11, 7);
    }
    
     
    //if (input === 'q') {
    //  rl.close();
    //  process.exit(0);
    //}
  }); 
*/
//rl.prompt();

//question(rl);

//});

/*
tape('test cursor', (t) => {

  const cursor = new Cursor(); 
  cursor.clr.to(0,0).out();
  process.stdout.write('test');
  t.end(); 
});
*/
