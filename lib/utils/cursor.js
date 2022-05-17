const log = require('mk-log');
const Colours = require('./colours.js');
const { AlignText, Const } = require('./align-text.js');
//require('tty').setRawMode(true);
const readline = require('readline');

const NormalColour = Colours().fg.white.bg.extCol(238);
const SelectedColour = Colours().fg.white.bg.extCol(243);
const FocusColour = Colours().fg.extCol(208).bg.extCol(238);

function EventBus() {
  const eventHandlers = {};

  return {
    addListener(name, handler) {
      let handlers = eventHandlers[name];
      if (!handlers) {
        handlers = [];
      }
      handlers.push(handler);
      eventHandlers[name] = handlers;
    },
    on(name, ...args) {
      const handlers = eventHandlers[name];
      if (!handlers) return false;
      for (let i = 0, l = handlers.length; i < l; i++) {
        handlers[i](...args);
      }
    },
  };
}

function writeAt(xOffset, yOffset, txt, colour = NormalColour) {
  return (x, y) => {
    const xPos = x + xOffset;
    const yPos = y + yOffset;
    readline.cursorTo(process.stdout, xPos, yPos);
    process.stdout.write(colour.build(txt));
  };
}

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

function loopRows(xOffset, yOffset, width, height, options) {
  for (let rowIndex = 0; rowIndex < height; rowIndex++) {
    if (options.borderDefs) {
      const bDefs = options.borderDefs;
      loopCols(
        { height, rowIndex, width: width },
        {
          topLeft: writeAt(xOffset, yOffset, bDefs.top.left, options.colour),
          top: writeAt(xOffset, yOffset, bDefs.hor.stroke, options.colour),
          topRight: writeAt(xOffset, yOffset, bDefs.top.right, options.colour),
          left: writeAt(xOffset, yOffset, bDefs.ver.stroke, options.colour),
          right: writeAt(xOffset, yOffset, bDefs.ver.stroke, options.colour),
          bottomLeft: writeAt(
            xOffset,
            yOffset,
            bDefs.bottom.left,
            options.colour
          ),
          bottom: writeAt(xOffset, yOffset, bDefs.hor.stroke, options.colour),

          bottomRight: writeAt(
            xOffset,
            yOffset,
            bDefs.bottom.right,
            options.colour
          ),
        }
      );
    } else {
      loopCols(
        { height, rowIndex, width },
        {
          anyBorder: writeAt(xOffset, yOffset, 'x', options.colour),
        }
      );
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
  let tabIndex = -1;
  const inputControls = [];
  const eventBus = EventBus();

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

  function registerControl(pubControl) {
    const count = inputControls.push(pubControl);
    pubControl.tabIndex = count - 1;
  }

  const pub = {
    Select(newOptions = {}) {
      const options = Object.assign({}, { list: [] }, newOptions);
      return (colOffset = 0, rowOffset = 0, width = 10, height = 5) => {
        let optionIndex = 0; // index of selected option
        let focus = false;
        const children = [];
        const selectPub = {
          keypress(chunk, char) {},
          setOptionIndex(newOptionIndex) {
            // index of option
            //if (newOptionIndex !== optionIndex) {
            const oldOptionIndex = optionIndex;
            optionIndex = newOptionIndex;
            selectPub.onOptionIndex(oldOptionIndex, optionIndex);
            //}
          },
          setFocus() {
            if (focus) return focus;
            focus = true;
            selectPub.onFocus();
            return selectPub;
          },
          setBlur() {
            if (!focus) return focus;
            focus = false;
            selectPub.onBlur();
          },
          onActive() {},
          onPassive() {},
          onOptionIndex() {
            selectPub.drawList(options.list);
          },
          onSelect() {},
          onFocus() {
            for (let i = 0, l = children.length; i < l; i++) {
              const child = children[i];
              if (child) {
                child.setFocus();
              }
            }
          },
          onBlur() {
            for (let i = 0, l = children.length; i < l; i++) {
              const child = children[i];
              if (child) {
                child.setBlur();
              }
            }
          },
          register() {}, // register inputControls list
          around(cb) {
            const child = cb(
              colOffset - 1,
              rowOffset - 1,
              width + 2,
              options.list.length + 2
            );
            children.push(child);
            return selectPub;
          },
          select(value) {
            const foundOptionIndex = options.list.findIndex(
              (i) => options.list[i] === value
            );
            if (foundOptionIndex !== -1 && foundOptionIndex !== optionIndex) {
              optionIndex = foundOptionIndex;
              selectPub.onSelect(optionIndex);
            }
            return selectPub;
          },
          drawList(list) {
            if (list) {
              for (let i = 0, l = list.length; i < l; i++) {
                const xPos = colOffset;
                const yPos = i + rowOffset;
                readline.cursorTo(process.stdout, xPos, yPos);

                const optionLabel = list[i].label;
                const alignedLabel = AlignText(optionLabel, {
                  alignType: Const.ALIGN_TYPE_LEFT,
                  width,
                });
                const leftAlignedLabel = alignedLabel.getSingleLine();
                if (optionIndex === i) {
                  process.stdout.write(SelectedColour.build(leftAlignedLabel));
                } else {
                  process.stdout.write(NormalColour.build(leftAlignedLabel));
                }
              }
            }
          },
        };
        selectPub.drawList(options.list);

        inputStream.addListener('keypress', (chunk, key) => {
          if (focus) {
            //log.info('list', options.list[0]);
            if (chunk === 'k') {
              if (optionIndex > 0) {
                optionIndex = optionIndex - 1;
                selectPub.setOptionIndex(optionIndex);
              }
            } else if (chunk === 'j') {
              if (optionIndex < options.list.length - 1) {
                optionIndex = optionIndex + 1;
                selectPub.setOptionIndex(optionIndex);
              }
            }
          }
        });
        // register select control
        inputControls.push(selectPub);
        return selectPub;
      };
    },
    Label(options = {}) {
      const children = [];
      let focus;

      return (colOffset = 0, rowOffset = 0, width = 1, height = 1) => {
        const labelPub = {
          formatTitle() {
            let alignedTitle = '';

            if (options.title) {
              alignedTitle = options.title;
              // Why 6? 2 border lines plus 1 padding on either side
              if (alignedTitle.length > width - 6) {
                alignedTitle = AlignText(options.title, {
                  alignType: Const.ALIGN_TYPE_LEFT,
                  width: width - 6,
                }).getSingleLine();
              }
            }
            return ` ${alignedTitle} `;
          },
          around(cb) {
            //
            const child = cb(
              colOffset - 1,
              rowOffset - 1,
              width + 2,
              height + 2
            );
            children.push(child);
            return labelPub;
          },
          setFocus() {
            if (focus) return focus;
            focus = true;
            labelPub.onFocus();
            return labelPub;
          },
          setBlur() {
            if (!focus) return focus;
            focus = false;
            labelPub.onBlur();
          },
          onFocus() {
            for (let i = 0, l = children.length; i < l; i++) {
              const child = children[i];
              if (child) {
                child.setFocus();
              }
            }
            const formattedTitle = labelPub.formatTitle(options.title);
            writeAt(colOffset, rowOffset, formattedTitle, FocusColour)(2, 0);
          },
          onBlur() {
            for (let i = 0, l = children.length; i < l; i++) {
              const child = children[i];
              if (child) {
                child.setBlur();
              }
            }
            const formattedTitle = labelPub.formatTitle(options.title);
            writeAt(colOffset, rowOffset, formattedTitle, NormalColour)(2, 0);
          },
        };

        const formattedTitle = labelPub.formatTitle(options.title);
        //log.info('colOffset', colOffset);
        //log.info('rowOffset', rowOffset);
        writeAt(colOffset, rowOffset, formattedTitle, NormalColour)(2, 0);

        return labelPub;
      };
    },
    TextField(newOptions = {}) {
      let focus = false;
      let textBuffer = '';
      let mode = 'normal';
      const options = Object.assign({}, newOptions, {
        placeholder: '',
        colour: NormalColour,
      });
      return (colOffset = 0, rowOffset = 0, width = 1, height = 1) => {
        const blank = ' '.repeat(width);
        const children = [];
        readline.cursorTo(process.stdout, colOffset, rowOffset);
        process.stdout.write(NormalColour.build(blank));

        const listeners = { input: [] };

        const textFieldPub = {
          around(cb) {
            const child = cb(colOffset - 1, rowOffset - 1, width + 2, 3);
            children.push(child);
            return textFieldPub;
          },
          setFocus() {
            if (focus) return focus;
            focus = true;
            textFieldPub.onFocus();
            return textFieldPub;
          },
          setBlur() {
            if (!focus) return focus;
            focus = false;
            textFieldPub.onBlur();
            return textFieldPub;
          },
          onFocus() {
            for (let i = 0, l = children.length; i < l; i++) {
              const child = children[i];
              if (child) {
                child.setFocus();
              }
            }
            return textFieldPub;
          },
          onBlur() {
            for (let i = 0, l = children.length; i < l; i++) {
              const child = children[i];
              if (child) {
                child.setBlur();
              }
            }
            return textFieldPub;
          },
          onBufferChange() {
            const alignedText = AlignText(textBuffer, {
              alignType: Const.ALIGN_TYPE_LEFT,
              width: width - 6,
            }).getSingleLine();
            readline.cursorTo(process.stdout, colOffset, rowOffset);
            process.stdout.write(NormalColour.build(alignedText));
          },
          addInputListener(listener) {
            listeners.input.push(listener);
            return textFieldPub;
          },
        };

        const textFieldPriv = {
          append(char) {
            const oldBuffer = textBuffer;
            textBuffer += char;
            textFieldPub.onBufferChange(textBuffer, oldBuffer);
          },
          removeLast() {
            textBuffer = textBuffer.slice(0, textBuffer.length - 1);
          },
        };

        inputStream.addListener('keypress', (chunk, key) => {
          if (focus) {
            readline.cursorTo(process.stdout, colOffset, rowOffset);
            if (key.name === 'return') {
              for (let i = 0, l = listeners.input.length; i < l; i++) {
                listeners.input[i](textBuffer);
              }
            }
            if (key.name === 'backspace') {
              textFieldPriv.removeLast();
            }
            textFieldPriv.append(chunk);
            //process.stdout.write(NormalColour.build(key.name));

            //if (key.name
            //if (!key.name.match(/\s|\d| /)) return false;
          }
        });

        inputControls.push(textFieldPub);
        return textFieldPub;
        /*
      rl.on('line', (input) => {
        log.info('input', input); 
      });
      */
      };
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

    Border(options = {}) {
      let colour = NormalColour;
      return (xOffset, yOffset, width, height) => {
        loopRows(xOffset, yOffset, width, height, options);
        const borderPub = {
          onBlur() {
            const focusOptions = Object.assign({}, options, {
              colour: NormalColour,
            });
            loopRows(xOffset, yOffset, width, height, focusOptions);
          },
          onFocus() {
            const focusOptions = Object.assign({}, options, {
              colour: FocusColour,
            });
            loopRows(xOffset, yOffset, width, height, focusOptions);
          },
          setBlur() {
            borderPub.onBlur();
          },
          setFocus() {
            borderPub.onFocus();
          },
        };
        return borderPub;
      };
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
      if (tabIndex !== -1) {
        inputControls[tabIndex].setBlur();
      }

      if (tabIndex === inputControls.length - 1) {
        tabIndex = 0;
      } else {
        tabIndex += 1;
      }

      inputControls[tabIndex].setFocus();
    } else if (chunk.match(/q|x/)) {
      clearInterval(interval);
      process.exit(0);
    }
    //process.stdout.write('Get Chunk: ' + chunk + '\n');
    //if (key && key.ctrl && key.name == 'c') process.exit();
  });

  return pub;
};
