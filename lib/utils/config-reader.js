const env = process.env.NODE_ENV || 'development';
const defaultConfigPath = `config/db-analyzer-${env}.js`;
const fs = require('fs').promises;
const path = require('path');
const log = require('mk-log');

module.exports = async function ConfigReader(configPath = defaultConfigPath) {
  let config;
  try {
    await fs.stat(configPath);
    config = require(path.resolve(configPath));
  } catch (err) {
    log.warn(err);
  }

  try {
    const pub = {
      insecure() {
        if (!config) {
          const text = `Security Warning: could not find config path for
          db analyzer in path ${configPath}. No restrictions apply`;
          log.warn(text);
          return text;
        }
      },
      node(nodeName) {
        return {
          denied() {
            log.debug('****** configPath', path.resolve(configPath));
            log.debug('****** config', config);
            return config[nodeName]?.deny;
          },
          query() {
            return {
              denied() {
                return config[nodeName]?.query?.deny;
              },
              public() {
                log.debug(config);
                return {
                  denied() {
                    return config[nodeName]?.query?.public?.deny;
                  },
                  field(fieldName) {
                    return {
                      denied() {
                        return config[nodeName]?.query?.public?.[fieldName]
                          ?.deny;
                      },
                    };
                  },
                };
              },
              admin() {
                return {
                  denied() {
                    return config[nodeName]?.query?.admin?.deny;
                  },
                  field(fieldName) {
                    return {
                      denied() {
                        return config[nodeName]?.query?.admin?.[fieldName]
                          ?.deny;
                      },
                    };
                  },
                };
              },
            };
          },
          mutation() {
            return {
              denied() {
                return config[nodeName]?.mutation?.deny;
              },
              public() {
                return {
                  denied() {
                    return config[nodeName]?.mutation?.public?.deny;
                  },
                  field(fieldName) {
                    return {
                      denied() {
                        return config[nodeName]?.mutation?.public?.[fieldName]
                          ?.deny;
                      },
                    };
                  },
                };
              },
              admin() {
                return {
                  denied() {
                    return config[nodeName]?.mutation?.admin?.deny;
                  },
                  field(fieldName) {
                    return {
                      denied() {
                        return config[nodeName]?.mutation?.admin?.[fieldName]
                          ?.deny;
                      },
                    };
                  },
                };
              },
            };
          },
        };
      },
    };

    pub.insecure();
    return pub;
  } catch (err) {
    log.error(err);
  }
};
