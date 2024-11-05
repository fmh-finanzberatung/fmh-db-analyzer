import Path from 'path';
import FastGlob from 'fast-glob';
import { pathToFileURL } from 'url'; // Import pathToFileURL
import log from 'mk-log';

const pluginExt = '.plugin.js';

/**
 * @description A Map decorator that allows to get a plugin by its name and iterate over all plugins.
 * @param {Array} pluginDirs - An array of plugin directories relative to root
 * like ['./plugins', './plugins/my-plugin']
 * @param {Object} options - An object containing options e.g. database connections, journals etc
 */

export default async function PluginManager(...pluginDirs) {
  const pluginManager = Object.create(
    {
      get(name) {
        return this.plugins.get(name);
      },
      exec(options) {
        for (const [name, plugin] of this.plugins) {
          const configuredPlugin = this.configure(name, plugin);
          configuredPlugin(options);
        }
      },
      // Configure is an abstract function that must be implemented by the PluginManager
      configure(name, plugin) {
        const pluginConfigOptions = this.pluginConfigOptions[name];
        if (pluginConfigOptions) {
          return plugin(pluginConfigOptions);
        }
        return plugin();
      },
      addPluginConfigOptions(pluginName, pluginConfigOptions) {
        this.pluginConfigOptions[pluginName] = pluginConfigOptions;
      },
    },
    {
      pluginConfigOptions: {
        value: {},
        enumerable: true,
        writable: true,
      },
      plugins: {
        value: new Map(),
        enumerable: true,
        writable: true,
      },
    }
  );

  for (const dir of pluginDirs) {
    const globPath = Path.resolve(Path.join(dir, `*${pluginExt}`));
    log.info('globPath', globPath);

    // Use asynchronous globbing
    const files = await FastGlob(globPath);

    for (const filePath of files) {
      const matchedExt = filePath.match(/.*\/(.*)\.plugin\.js$/);
      log.debug('PLUGIN MANAGER matchedExt', matchedExt);
      if (matchedExt) {
        const fullPath = Path.resolve(filePath);
        const fileUrl = pathToFileURL(fullPath).href;

        //try {
          const pluginModule = await import(fileUrl);
          const plugin = pluginModule.default || pluginModule;
          const name = matchedExt[1];
          log.info('PLUGIN MANAGER plugin name', name);
          pluginManager.plugins.set(name, plugin);
        //} catch (error) {
        // log.error(`Failed to load plugin at ${filePath}:`, error);
        //}
      }
    }
  }

  return pluginManager;
}
