const log = require('mk-log');
const Colours = require('./colours.js');
const { AlignText, Const } = require('./align-text.js');
//require('tty').setRawMode(true);
const readline = require('readline');

const normalColour = Colours().fg.white.bg.extCol(238);
const selectedColour = Colours().fg.white.bg.extCol(243);

function loopCols({ height, rowIndex, width }, newCallbacks) {
  const callbacks = Object.assign(
    {},
    {
      topLeft() {},
      top() {},
      topRight() {},
      left() {},
      right() {},
      bottomLeft() {},
      bottom() {},
      bottomRight() {},
      any() {}, // any position within area
      anyBorder() {}, // any border of area
    },
    newCallbacks
  );

  //log.info('rowIndex         ', rowIndex);
  //log.info('width            ', width);
  //log.info('height           ', height);

  for (let i = 0; i < width; i++) {
    callbacks.any(i, rowIndex);
    if (rowIndex === 0) {
      callbacks.anyBorder(i, rowIndex);
      if (i === 0) {
        callbacks.topLeft(i, rowIndex);
      } else if (i === width - 1) {
        callbacks.topRight(i, rowIndex);
      } else {
        callbacks.top(i, rowIndex);
      }
    } else if (rowIndex === height - 1) {
      //log.info('rowIndex   ', rowIndex);
      //log.info('height - 1 ', height - 1);

      callbacks.anyBorder(i, rowIndex);
      if (i === 0) {
        callbacks.bottomLeft(i, rowIndex);
      } else if (i === width - 1) {
        callbacks.bottomRight(i, rowIndex);
      } else {
        callbacks.bottom(i, rowIndex);
      }
    } else {
      if (i === 0) {
        callbacks.anyBorder(i, rowIndex);
        callbacks.left(i, rowIndex);
      } else if (i === width - 1) {
        callbacks.anyBorder(i, rowIndex);
        callbacks.right(i, rowIndex);
      }
    }
  }
}

function deconstructArgs(args, defaultOptions = {}) {
  //const coordArgs = Object.keys(arguments).map((k) => arguments[k]);
  const coordArgs = args;
  const lastIndex = coordArgs.length - 1;
  let options = {};
  // const coordArgs = Array.from(arguments);
  const lastArg = coordArgs[lastIndex];

  if (typeof lastArg === 'object') {
    Object.assign(options, defaultOptions, lastArg);
    coordArgs.pop(); // remove options arg
  }
  const xOffset = coordArgs[0] || 0;
  const yOffset = coordArgs[1] || 0;
  const width = coordArgs[2] || 1;
  const height = coordArgs[3] || 1;

  return {
    coords: {
      xOffset,
      yOffset,
      width,
      height,
    },
    options,
  };

  /*
  area(...coordArgs).fill((col, row) => {
    readline.cursorTo(process.stdout, col, row);
    process.stdout.write(options.char);
  });
  */
}

module.exports = function Cursor(inputStream, outputStream, newCallbacks = {}) {
  const callbacks = Object.assign(
    {},
    {
      mode() {},
    },
    newCallbacks
  );

  let mode = 'm';

  readline.emitKeypressEvents(inputStream);
  //if (inputStream.isTTY) process.stdin.setRawMode(true);
  const rl = readline.createInterface({
    input: inputStream,
    output: outputStream,
    //terminal: true,
    //autoCommit: true,
  });

  const modes = [
    {
      value: 'm',
      label: 'Move',
      options: { h() {}, j() {}, k() {}, l() {} },
    },
    { value: 'e', label: 'Edit', opitions: { i() {} } },
  ];

  const interval = setInterval(() => {
    const date = new Date();
    const foundMode = modes.find((md) => md.value === mode);
    const statusString =
      'Mode: ' + foundMode.label + ' ' + date.toLocaleTimeString();
    readline.cursorTo(process.stdout, 1, 1);
    process.stdout.write(statusString);
  }, 200);

  const inputControls = [];

  const pub = {
    Select(
      colOffset = 0,
      rowOffset = 0,
      width = 10,
      height = 5,
      newOptions = {}
    ) {
      let index = 0;
      let focus = false;
      let active = false; // active ready for editing
      const { coords, options } = deconstructArgs(Array.from(arguments), {
        list: [],
      });

      const selectPub = {
        keypress(chunk, char) {},
        set index(newIndex) {
          //if (newIndex !== index) {
            const oldIndex = index;
            index = newIndex;
            selectPub.onIndex(oldIndex, index);
          //}
        },
        get isActive() {
          return active;
        },
        active() {
          if (active) return active;
          active = true;
          selectPub.onActive();
        },
        passive() {
          if (!active) return active;
          active = false;
          selectPub.onPassive();
        },
        focus() {
          if (focus) return focus;
          focus = true;
          selectPub.onFocus();
          return selectPub;
        },
        blur() {
          if (!focus) return focus;
          focus = false;
          selectPub.onBlur();
        },
        onActive() {},
        onPassive() {},
        onIndex() {
          selectPub.drawList(options.list);
        },
        onSelect() {},
        onFocus() {},
        onBlur() {},
        register() {}, // register inputControls list
        select(value) {
          const foundIndex = options.list.findIndex(
            (i) => options.list[i] === value
          );
          if (foundIndex !== -1 && foundIndex !== index) {
            index = foundIndex;
            selectPub.onSelect(index);
          }
          return selectPub;
        },
        drawList(list) {
          if (list) {
            for (let i = 0, l = list.length; i < l; i++) {
              const xPos = coords.xOffset;
              const yPos = i + coords.yOffset;
              readline.cursorTo(process.stdout, xPos, yPos);

              const optionLabel = list[i].label;
              const alignedLabel = AlignText(optionLabel, {
                alignType: Const.ALIGN_TYPE_LEFT,
                width,
              });
              const leftAlignedLabel = alignedLabel.getSingleLine();
              if (index === i) {
                process.stdout.write(selectedColour.build(leftAlignedLabel));
              } else {
                process.stdout.write(normalColour.build(leftAlignedLabel));
              }
            }
          }
        },
      };

      selectPub.drawList(options.list);

      inputStream.addListener('keypress', function (chunk, key) {
        if (selectPub.isPassive) return false;
        if (chunk === 'k') {
          if( index > 0) {
            selectPub.index = index - 1;
          } 
        } else if (chunk === 'j') {
          if( index < options.list.length - 1) {
            selectPub.index = index + 1;
          } 
        }
      });
      // register select control
      inputControls.push(selectPub);
      return selectPub;
    },
    input(
      colOffset = 0,
      rowOffset = 0,
      width = 1,
      height = 1,
      newOptions = { onInput() {} }
    ) {
      const { coordArgs, options } = deconstructArgs(Array.from(arguments));
      readline.cursorTo(process.stdout, colOffset, rowOffset);

      /*
      rl.on('line', (input) => {
        log.info('input', input); 
      });
      */
    },
    fill(colOffset = 0, rowOffset = 0, width = 1, height = 1, newOptions = {}) {
      const { coords, options } = deconstructArgs(Array.from(arguments));

      for (let i = 0; i < coords.height; i++) {
        loopCols(
          { height: coords.height, rowIndex: i, width: coords.width },
          {
            any(x, y) {
              const xPos = x + coords.xOffset;
              const yPos = y + coords.yOffset;
              //log.info('xPos', xPos);
              //log.info('yPos', yPos, options.char);
              readline.cursorTo(process.stdout, xPos, yPos);
              process.stdout.write(options.char);
            },
          }
        );
      }
    },

    border(
      colOffset = 0,
      rowOffset = 0,
      width = 1,
      height = 1,
      newOptions = {}
    ) {
      const { coords, options } = deconstructArgs(
        Array.from(arguments),
        newOptions
      );

      for (let rowIndex = 0; rowIndex < coords.height; rowIndex++) {
        if (options.borderDefs) {
          const bDefs = options.borderDefs;
          loopCols(
            { height, rowIndex, width: coords.width },
            {
              topLeft(x, y) {
                const xPos = x + coords.xOffset;
                const yPos = y + coords.yOffset;
                readline.cursorTo(process.stdout, xPos, yPos);
                process.stdout.write(bDefs.top.left);
              },
              top(x, y) {
                const xPos = x + coords.xOffset;
                const yPos = y + coords.yOffset;
                readline.cursorTo(process.stdout, xPos, yPos);
                process.stdout.write(bDefs.hor.stroke);
              },
              topRight(x, y) {
                const xPos = x + coords.xOffset;
                const yPos = y + coords.yOffset;
                readline.cursorTo(process.stdout, xPos, yPos);
                process.stdout.write(bDefs.top.right);
              },
              left(x, y) {
                const xPos = x + coords.xOffset;
                const yPos = y + coords.yOffset;
                readline.cursorTo(process.stdout, xPos, yPos);
                process.stdout.write(bDefs.ver.stroke);
              },
              right(x, y) {
                const xPos = x + coords.xOffset;
                const yPos = y + coords.yOffset;
                readline.cursorTo(process.stdout, xPos, yPos);
                process.stdout.write(bDefs.ver.stroke);
              },
              bottomLeft(x, y) {
                const xPos = x + coords.xOffset;
                const yPos = y + coords.yOffset;
                readline.cursorTo(process.stdout, xPos, yPos);
                process.stdout.write(bDefs.bottom.left);
              },
              bottom(x, y) {
                const xPos = x + coords.xOffset;
                const yPos = y + coords.yOffset;
                readline.cursorTo(process.stdout, xPos, yPos);
                process.stdout.write(bDefs.hor.stroke);
              },
              bottomRight(x, y) {
                const xPos = x + coords.xOffset;
                const yPos = y + coords.yOffset;
                readline.cursorTo(process.stdout, xPos, yPos);
                process.stdout.write(bDefs.bottom.right);
              },
            }
          );
        } else {
          loopCols(
            { height, rowIndex, width },
            {
              anyBorder(x, y) {
                const xPos = x + coords.xOffset;
                const yPos = y + coords.yOffset;
                readline.cursorTo(process.stdout, xPos, yPos);
                process.stdout.write(options.char);
              },
            }
          );
        }
      }
      return pub;
    },
  };

  /*
  each InputControl is registered with inputControls list;
  when a key is pressed the event loop loops over all conrols
  and invokes keypress on all items.
  Each item then by itself must check if it is active
  and if it is behave according to the pressed key. 
  E.g. move up or down or on enter select an item and then redraw.
*/

  inputStream.addListener('keypress', function (chunk, key) {
    if (key.name === 'tab') {
      const foundIndex = inputControls.findIndex((control) => {
        if (control.isActive) {
          control.passive();
          return true;
        }
      });
      if (foundIndex === inputControls.length - 1) {
        inputControls[0].active();
      } else {
        inputControls[foundIndex + 1].active();
      }
    }

    if (chunk.match(/q|x/)) {
      clearInterval(interval);
      process.exit(0);
    }
    //process.stdout.write('Get Chunk: ' + chunk + '\n');
    //if (key && key.ctrl && key.name == 'c') process.exit();
  });

  return pub;
};
