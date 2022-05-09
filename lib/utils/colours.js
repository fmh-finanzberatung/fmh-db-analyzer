const log = require('mk-log');
// more about escape codes
// https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
const GROUND_TYPE_FG = '38;5';
const GROUND_TYPE_BG = '48;5';

const INTENSITY_TYPE_DIM = 0;
const INTENSITY_TYPE_BRIGHT = 8; // add to DIM color ground codes

const readline = require('readline');

function codeGroundString(groundType = GROUND_TYPE_FG, colourNum) {
  return `\x1b[${groundType};${colourNum}m`;
}

function codeSpecialString(colourNum) {
  return `\x1b[${colourNum}m`;
}

function groundCodes(groundType, newOptions) {
  const options = Object.assign(
    {},
    {
      intensityType: INTENSITY_TYPE_DIM,
    },
    newOptions
  );

  const codes = {
    black: codeGroundString(groundType, 0 + options.intensityType),
    red: codeGroundString(groundType, 1 + options.intensityType),
    green: codeGroundString(groundType, 2 + options.intensityType),
    yellow: codeGroundString(groundType, 3 + options.intensityType),
    blue: codeGroundString(groundType, 4 + options.intensityType),
    magenta: codeGroundString(groundType, 5 + options.intensityType),
    cyan: codeGroundString(groundType, 6 + options.intensityType),
    white: codeGroundString(groundType, 7 + options.intensityType),
  };
  return codes;
}

const EffectCodes = {
  reset: codeSpecialString(0),
  bright: codeSpecialString(1), // has no effect at all
  dim: codeSpecialString(2),
  underline: codeSpecialString(4),
  blink: codeSpecialString(5),
  reverse: codeSpecialString(7),
  hidden: codeSpecialString(8),
};

function ColourCodes() {
  let ground = 'fg';
  let intensityType = INTENSITY_TYPE_DIM;
  let at = -1;
  let fgCode;
  let bgCode;
  const effectCodes = [];
  const ForegroundColourCodes = groundCodes(GROUND_TYPE_FG);
  const BackgroundColourCodes = groundCodes(GROUND_TYPE_BG);
  return {
    get fg() {
      return groundCodes(GROUND_TYPE_FG, { intensityType });
    },
    get bg() {
      return groundCodes(GROUND_TYPE_BG, { intensityType });
    },
    //special: EffectCodes,
    set at(newAt = -1) {
      at = newAt;
    },
    get at() {
      return at;
    },
    set fgCode(newFgCode) {
      fgCode = newFgCode;
    },
    get fgCode() {
      return fgCode;
    },
    set bgCode(newBgCode) {
      bgCode = newBgCode;
    },
    get bgCode() {
      return bgCode;
    },
    addEffect(newEffectCode) {
      // prevent duplicate entries
      if (effectCodes.indexOf(newEffectCode) >= 0) return false;
      effectCodes.push(newEffectCode);
    },
    get effectCodes() {
      return effectCodes.join('');
    },
    clearEffects() {
      effectCodes.slice; 
    },
    set ground(newGround = 'fg') {
      ground = newGround;
    },
    get ground() {
      return ground;
    },
    set intensityType(newIntensityType = INTENSITY_TYPE_DIM) {
      intensityType = newIntensityType;
    },
    get intensityType() {
      return intensityType;
    },
    get fgNames() {
      return Object.keys(ForegroundColourCodes);
    },
    get bgNames() {
      return Object.keys(BackgroundColourCodes);
    },
    get specialNames() {
      return Object.keys(EffectCodes);
    },
  };
}

function buildNamesRegExp(list) {
  return new RegExp(`^(${list.join('|')})`);
}

module.exports = function Colours() {
  const colourCodes = ColourCodes();

  const proxy = new Proxy(colourCodes, {
    get(target, name) {
      const state = name.match(/^(state)$/)?.[1];
      if (state) {
        process.stdout.write('\n\r-------- State --------\n\r');
        process.stdout.write(`ground   : ${target.ground}\n\r`);
        process.stdout.write(`at       : ${target.at}\n\r`);
        process.stdout.write(`intensity: ${target.intensityType}\n\r`);
        process.stdout.write('\n\r------------------------\n\r');
        //process.stdout.write('\n');
        return proxy;
      }
      const at = name.match(/^(at)$/)?.[1];
      if (at) {
        return function (pos) {
          target.at = pos;
          return proxy;
        };
        //target.ground = ground;
      }
      const out = name.match(/^(out)$/)?.[1];
      if (out) {
        return function (text) {
          if (target.at >= 0) {
            readline.cursorTo(process.stdout, 20);
          }
          if (text && text.length) {
            process.stdout.write(target.fgCode);
            process.stdout.write(target.bgCode);
            process.stdout.write(target.effectCodes);
            // process.stdout.write(target.special.bright);
            // process.stdout.write(target.special.underline);
            process.stdout.write(text);
            process.stdout.write(EffectCodes.reset);
          }
          return proxy;
        };
      }
      const extCol = name.match(/^(extCol)$/)?.[1];
      if (extCol) {
        return function (extColourCode) {
          if (extColourCode < 16) {
            throw new Error('colour code must be 16 or greater');
          }
          if (extColourCode > 255) {
            throw new Error('colour code must be 255 or smaller');
          }
          if (target.ground === 'fg') {
            const codeString = codeGroundString(GROUND_TYPE_FG, extColourCode);
            target.fgCode = codeString;
          } else {
            const codeString = codeGroundString(GROUND_TYPE_BG, extColourCode);
            target.bgCode = codeString;
          }
          return proxy;
        };
      }
      const build = name.match(/^(build)$/)?.[1];
      if (build) {
        return function (chars) {
          let resultCode = '';
          if (chars) {
            resultCode += target.fgCode;
            resultCode += target.bgCode;
            resultCode += chars;
            resultCode += EffectCodes.reset;
          }
          return resultCode;
        };
      }
      // clear line
      const ln = name.match(/^(cln)$/)?.[1];
      if (ln) {
        process.stdout.write('\x1b[2k');
        return proxy;
      }
      const cr = name.match(/^(nr|cr)$/)?.[1];
      if (cr) {
        process.stdout.write('\n\r');
        return proxy;
      }
      // clear removes fgCode and bgCode
      const clear = name.match(/^(clear|clr)$/)?.[1];
      if (clear) {
        target.bgCode = '';
        target.bgCode = '';
        target.clearEffects();
        return proxy;
      }
      const intensity = name.match(/^(dim|bright)$/)?.[1];
      if (intensity) {
        target.intensityType =
          intensity === 'dim' ? INTENSITY_TYPE_DIM : INTENSITY_TYPE_BRIGHT;
        return proxy;
      }
      const ground = name.match(/^(fg|bg)$/)?.[1];
      if (ground) {
        target.ground = ground;
        return proxy;
      }
      const fgRegExp = buildNamesRegExp(target.fgNames);
      const bgRegExp = buildNamesRegExp(target.bgNames);
      const colourName = name.match(fgRegExp)?.[1] || name.match(bgRegExp)?.[1];

      if (colourName) {
        if (target.ground === 'fg') {
          const fgRegExp = buildNamesRegExp(target.fgNames);
          const fgColour = name.match(fgRegExp)?.[1];
          target.fgCode = target['fg'][fgColour];
        } else if (target.ground === 'bg') {
          const bgRegExp = buildNamesRegExp(target.bgNames);
          const bgColour = name.match(bgRegExp)?.[1];
          target.bgCode = target['bg'][bgColour];
        }
        return proxy;
      }


      const effectRegExp = buildNamesRegExp(Object.keys(EffectCodes));
      const effectKey = name.match(effectRegExp)?.[1];
      if (effectKey) {
        const effectCode = EffectCodes[effectKey];
        target.addEffect(effectCode); 
        //process.stdout.write(EffectCodes[effectKey]);
        return proxy;
      }
      log.warn('unknow colour key', name);
      return proxy;
    },
  });

  return proxy;
};
