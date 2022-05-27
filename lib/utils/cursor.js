const log = require('mk-log');
const Colours = require('./colours.js');
const { AlignText, Const } = require('./align-text.js');
//require('tty').setRawMode(true);
const readline = require('readline');

const NormalColour = Colours().fg.white.bg.extCol(238);
const SelectedColour = Colours().fg.white.bg.extCol(243);
const FocusColour = Colours().fg.extCol(208).bg.extCol(238);
const InfoColour = Colours().fg.extCol(228).bg.extCol(21);

function numCharKey(num) {
  const s = '123456789abcefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return s.charAt(num);
}

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

function Modes() {
  const inputControls = new Map();

  let mode = 'f'; // default focus mode
  let tabKey = '';
  const modePub = {
    get inputControls() {
      return inputControls;
    },
    get controlsList() {
      return Array.from(inputControls);
    },
    get controlKeys() {
      return Array.from(inputControls.keys());
    },
    registerControl(newControl) {
      const controlKey = numCharKey(inputControls.size);
      inputControls.set(controlKey, newControl);
    },
    mode: {
      set(newMode) {
        mode = newMode;
      },
      get() {
        return mode;
      },
    },
    keypress(chunk, key) {
      modePub[mode].keypress(chunk, key);
    },
    tabKey: {
      get() {
        return tabKey;
      },
    },
    e: {
      // edit mode
      keypress(chunk, key) {
        if (modePub.e[key.name]) {
          modePub.e[key.name]();
        } else {
          inputControls.get(tabKey).keypress(chunk, key);
        }
      },
      escape() {
        inputControls.get(tabKey).setBlur();
        mode = 'f';
      },
    },
    f: {
      // focus mode
      keypress(chunk, key) {
        if (inputControls.has(chunk)) {
          if (tabKey) {
            inputControls.get(tabKey).setBlur();
          }
          tabKey = key.name;
          inputControls.get(tabKey).setFocus();
          mode = 'e';
        } else if (modePub[mode]?.[chunk]) {
          modePub[mode][chunk]();
        } else if (modePub[mode]?.[key.name]) {
          modePub[mode][key.name]();
        }
      },
      escape() {
        if (tabKey) inputControls.get(tabKey).setBlur();
      },
      tab() {
        if (!tabKey) {
          tabKey = modePub.controlKeys[0];
        } else {
          for (let i = 0, l = modePub.controlsList.length; i < l; i++) {
            const [iterKey, iterControl] = modePub.controlsList[i];
            if (iterKey === tabKey) {
              iterControl.setBlur();
              let nextControlKey;
              if (i === modePub.controlsList.length - 1) {
                nextControlKey = modePub.controlKeys[0];
              } else {
                nextControlKey = modePub.controlKeys[i + 1];
              }
              tabKey = nextControlKey;
              break;
            }
          }
        }

        inputControls.get(tabKey).setFocus();
        mode = 'e';
      },
      onExit() {
        process.exit(0);
      },
      q() {
        modePub[mode].onExit();
      },
      x() {
        modePub[mode].onExit();
      },
    },
  };

  return modePub;
}

module.exports = function Cursor(newCallbacks = {}) {
  const inputStream = process.stdin;
  inputStream.setRawMode(true);
  //inputStream.pause();
  //const outputStream = process.stdout;
  const callbacks = Object.assign(
    {},
    {
      mode() {},
    },
    newCallbacks
  );

  const eventBus = EventBus();
  const modes = Modes();

  readline.emitKeypressEvents(inputStream);
  //if (inputStream.isTTY) process.stdin.setRawMode(true);

  const pub = {
    StatusBar(newOptions = {}) {
      return (colOffset = 0, rowOffset = 0, cols = 0, rows = 0) => {
        const interval = setInterval(() => {
          const date = new Date();
          const statusString = 'Status Bar ' + date.toLocaleTimeString();
          readline.cursorTo(process.stdout, 1, 1);
          process.stdout.write(statusString);
        }, 200);
        const stateBarPub = {
          onClose() {
            clearInterval(interval);
          },
          get chain() {
            // return
            return pub;
          },
        };
        return stateBarPub;
      };
    },
    Select(newOptions = {}) {
      const options = Object.assign({}, { list: [] }, newOptions);
      return (colOffset = 0, rowOffset = 0, width = 10, height = 5) => {
        let optionIndex = 0; // index of selected option
        let focus = false;
        const children = [];
        const selectPub = {
          keypress(chunk, key) {
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
          },
          onClose() {},
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

        /*
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
        */
        modes.registerControl(selectPub);
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

        const textFieldPriv = {
          append(char) {
            const oldBuffer = textBuffer;
            textBuffer += char;
            textFieldPub.onBufferChange(textBuffer, oldBuffer);
          },
          removeLast() {
            const oldBuffer = textBuffer;
            textBuffer = textBuffer.slice(0, textBuffer.length - 1);
            textFieldPub.onBufferChange(textBuffer, oldBuffer);
          },
        };

        const textFieldPub = {
          keypress(chunk, key) {
            readline.cursorTo(process.stdout, colOffset, rowOffset);
            if (key.name === 'return') {
              for (let i = 0, l = listeners.input.length; i < l; i++) {
                listeners.input[i](textBuffer);
              }
            } else if (key.name === 'backspace') {
              textFieldPriv.removeLast();
            } else if (chunk) {
              textFieldPriv.append(chunk);
            }

            //process.stdout.write(NormalColour.build(key.name));

            //if (key.name
            //if (!key.name.match(/\s|\d| /)) return false;
          },
          onClose() {},
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
          onBufferChange(textBuffer, _oldBuffer) {
            //log.info('textBuffer', textBuffer);
            //log.info('oldBuffer ', oldBuffer);
            const alignedText = AlignText(textBuffer, {
              alignType: Const.ALIGN_TYPE_LEFT,
              width: width - 4,
            }).getSingleLine();
            readline.cursorTo(process.stdout, colOffset, rowOffset);
            process.stdout.write(NormalColour.build(alignedText));
          },
          addInputListener(listener) {
            listeners.input.push(listener);
            return textFieldPub;
          },
        };

        modes.registerControl(textFieldPub);
        return textFieldPub;
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

    TabKey(options = {}) {
      return (xOffset, yOffset, width, height) => {
        const latestRegisteredKey =
          modes.controlKeys[modes.controlKeys.length - 1];
        const tabKeyPub = {
          onBlur() {
            readline.cursorTo(process.stdout, xOffset, yOffset);
            process.stdout.write(InfoColour.build(latestRegisteredKey));
          },
          onFocus() {
            readline.cursorTo(process.stdout, xOffset, yOffset);
            process.stdout.write(InfoColour.build(latestRegisteredKey));
          },
          setBlur() {
            tabKeyPub.onBlur();
          },
          setFocus() {
            tabKeyPub.onFocus();
          },
        };

        readline.cursorTo(process.stdout, xOffset, yOffset);
        process.stdout.write(InfoColour.build(latestRegisteredKey));
        return tabKeyPub;
      };
    },
  };

  log.info('inputControls', modes.inputControls);

  /*
  each InputControl is registered with inputControls list;
  when a key is pressed the event loop loops over all conrols
  and invokes keypress on all items.
  Each item then by itself must check if it is active
  and if it is behave according to the pressed key. 
  E.g. move up or down or on enter select an item and then redraw.
  */

  log.info(modes.inputControls);

  inputStream.addListener('keypress', modes.keypress);

  return pub;
};
