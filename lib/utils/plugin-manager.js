const Path = require('path');
const FastGlob = require('fast-glob');
const pluginExt = '.plugin.js';
const log = require('mk-log');

/**
 * @description A Map decorator that allows to get a plugin by its name and iterate over all plugins.
 * @param {Array} pluginDirs - An array of plugin directories relative to root
  * like ['./plugins', './plugins/my-plugin']
 * @param {Object} options - An object containing options e.g. database connections, journals etc
 */

module.exports = function PluginManager(...pluginDirs) {
  const pluginManager = Object.create(
    {
      set(name, plugin) {
        // fire configure event before adding plugin
        const configuredPlugin = this.configure(name, plugin);
        this.plugins.set(name, configuredPlugin);
      },
      get(name) {
        return this.plugins.get(name);
      },
      exec(options) {
        Array.from(this.plugins).forEach(([_name, plugin]) => {
          plugin(options);
        });
      },
      // plugin must be a "thunk"
      // configure is an abstract function that must be implemented by the PluginManager
      configure(name, plugin) {
        // configure must be implemented
        // if this plugin needs modifications

        // log.info('name               ', name);
        // log.info('this               ', this);
        // log.info('pluginConfigOptions', this.pluginConfigOptions);

        const pluginConfigOptions = this.pluginConfigOptions[name];
        // log.info('pluginConfigOptions', pluginConfigOptions);

        if (pluginConfigOptions) {
          return plugin(pluginConfigOptions);
        }
        return plugin();
      },
      addPluginConfigOptions(pluginName, pluginConfigOptions) {
        log.info('addPluginConfigOptions', pluginConfigOptions);
        this.pluginConfigOptions[pluginName] = pluginConfigOptions;
      },
    },
    {
      pluginConfigOptions: {
        type: Object,
        value: {},
        enumerable: true,
      },
      plugins: {
        type: Object,
        value: new Map(),
        enumerable: true,
      },
    }
  );

  pluginDirs.forEach((dir) => {
    const globPath = Path.resolve(Path.join(dir, `*${pluginExt}`));
    log.info('globPath', globPath);
    const files = FastGlob.sync(globPath);
    files.forEach((filePath) => {
      const matchedExt = filePath.match(/.*\/(.*)\.plugin\.js$/);
      log.debug('PLUGIN MANAGER matchedExt', matchedExt);
      if (matchedExt) {
        const plugin = require(filePath);
        const name = matchedExt[1];
        log.debug('PLUGIN MANAGER plugin name', name);
        pluginManager.set(name, plugin);
      }
    });
  });

  return pluginManager;
};
