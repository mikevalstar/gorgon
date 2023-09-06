import MemoryCache from './provider/memory';

export type asyncFunction = () => Promise<any> | (() => any);
export type GorgonHookKey =
  | 'settings'
  | 'addProvider'
  | 'put'
  | 'clear'
  | 'clearAll'
  | 'overwrite'
  | 'get'
  | 'valueError';
export type GorgonHook = (key: GorgonHookKey, input?: any, output?: any) => void;
export type GorgonSettings = {
  debug: boolean;
  defaultProvider: string;
  retry: number;
};
export type GorgonSettingsInput = {
  debug?: boolean;
  defaultProvider?: string;
  retry?: number;
};
export type GorgonPolicy = {
  expiry: number | Date | false;
  provider: string;
};
export type GorgonPolicyInput = GorgonPolicy | number | Date;
export type GorgonPolicySanitized = {
  expiry: number | false;
  provider: string;
};
type GorgonCurrentTaskItem = Array<{
  res?: any;
  rej?: any;
  queued: Date;
}>;
export interface IGorgonCacheProvider {
  init: () => Promise<void>;
  get: (key: string) => Promise<any>;
  set: <R>(key: string, value: R, policy: GorgonPolicySanitized) => Promise<R>;
  clear: (key?: string) => Promise<boolean>;
  keys: () => Promise<string[]>;
}

const Gorgon = (() => {
  const currentTasks = {} as { [key: string]: GorgonCurrentTaskItem };
  const hOP = currentTasks.hasOwnProperty;

  const settings = {
    debug: false,
    defaultProvider: 'memory',
    retry: 5000,
  } as GorgonSettings;

  const policyMaker = function (incPolicy?: GorgonPolicyInput) {
    const outPolicy = {
      expiry: false,
      provider: settings.defaultProvider,
    } as GorgonPolicySanitized;

    // Blank policy, false, or no policy. lets store forever
    if (!incPolicy) {
      return outPolicy;
    }

    // Type is a full policy object
    if (incPolicy instanceof Date) {
      var d = new Date();

      outPolicy.expiry = Math.ceil((incPolicy.getTime() - d.getTime()) / 1000);
    } else if (typeof incPolicy === 'object' && incPolicy.expiry) {
      if (incPolicy.expiry instanceof Date) {
        outPolicy.expiry = Math.ceil((incPolicy.expiry.getTime() - d.getTime()) / 1000);
      } else {
        outPolicy.expiry = incPolicy.expiry;
      }
      outPolicy.provider = incPolicy.provider || outPolicy.provider;
    } else if (typeof incPolicy === 'object') {
      outPolicy.provider = incPolicy.provider || outPolicy.provider;
    } else if (typeof incPolicy === 'number') {
      outPolicy.expiry = incPolicy;
    }

    // Number is too small, negative or not a number
    outPolicy.expiry = outPolicy.expiry && outPolicy.expiry > 0 ? outPolicy.expiry : false;

    return outPolicy;
  };

  const gorgonCore = {
    // Providers available for use
    providers: {} as { [key: string]: IGorgonCacheProvider },

    // Hooks
    hooks: {} as { [key: string]: Array<GorgonHook> },

    _callHooks: (key: GorgonHookKey, input?: any, output?: any) => {
      if (hOP.call(gorgonCore.hooks, key)) {
        for (var i in gorgonCore.hooks[key]) {
          if (typeof gorgonCore.hooks[key][i] === 'function') {
            try {
              gorgonCore.hooks[key][i](key, input, output);
            } catch (e) {
              console.error('[Gorgon] Hook error for hook: ' + key, e);
            }
          }
        }
      }
    },

    // Allows for settings on the gorgon cache
    settings: (newSettings?: GorgonSettingsInput) => {
      if (!newSettings) {
        return settings;
      }

      Object.assign(settings, newSettings); // only overwrite ones sent in; keep others at existing

      gorgonCore._callHooks('settings', newSettings, settings);

      return settings;
    },

    // add a hook or array of hooks
    addHook: (key: GorgonHookKey, hook: GorgonHook | Array<GorgonHook>) => {
      if (!hOP.call(gorgonCore.hooks, key)) {
        gorgonCore.hooks[key] = [];
      }

      if (Array.isArray(hook)) {
        gorgonCore.hooks[key] = gorgonCore.hooks[key].concat(hook);
      } else {
        gorgonCore.hooks[key].push(hook);
      }
    },

    // Add a provider
    addProvider: (name: string, provider: IGorgonCacheProvider) => {
      provider.init(); // Trigger for provider to clear any old cache items or any other cleanup
      gorgonCore.providers[name] = provider;

      gorgonCore._callHooks('addProvider', { name, provider });
    },

    // Place an item into the cache
    put: async <R>(key: string, value: R, policy?: GorgonPolicyInput): Promise<R> => {
      policy = policyMaker(policy);
      var prov = gorgonCore.providers[policy.provider];

      gorgonCore._callHooks('put', { key, value, policy }, value);

      return prov.set(key, value, policyMaker(policy));
    },

    // Clear one or all items in the cache
    clear: async (key: string, provider?: string) => {
      var prov = gorgonCore.providers[provider || settings.defaultProvider];

      gorgonCore._callHooks('clear', { key, provider });

      // Clear a wildcard search of objects
      if (key && key.indexOf('*') > -1) {
        return prov.keys().then(function (keys) {
          var cacheMatchKeys = keys.filter(function (str) {
            return new RegExp('^' + key.split('*').join('.*') + '$').test(str);
          });

          var clearPromises = cacheMatchKeys.map(prov.clear);
          // Incase someone somehow used a wildcard in their cached key (don't do this)

          clearPromises.push(prov.clear(key));
          return Promise.all(clearPromises);
        });
      }

      // Not a special clear
      return prov.clear(key);
    },

    // Clear all keys/values in the cache
    clearAll: async (provider?: string) => {
      var prov = gorgonCore.providers[provider || settings.defaultProvider];

      gorgonCore._callHooks('clearAll', { provider });

      return prov.clear();
    },

    // Allows you to instantly overwite a cache object
    overwrite: async (key: string, asyncFunc: asyncFunction, policy?: GorgonPolicyInput) => {
      try {
        const resolvedData = await asyncFunc();

        const val = await gorgonCore.put(key, resolvedData, policyMaker(policy));

        gorgonCore._callHooks('overwrite', { key, asyncFunc, policy }, val);

        return val;
      } catch (e) {
        throw e;
      }
    },

    // Allows you to get from the cache or pull from the promise
    get: async <R>(key: string, asyncFunc: () => R, policy?: GorgonPolicyInput): Promise<R> => {
      policy = policyMaker(policy);
      const prov = gorgonCore.providers[policy.provider];

      const currentVal = await prov.get(key); // Most providers will only lookup by key and return false on not found

      // If we have a current value sent it out; cache hit!
      if (currentVal !== undefined) {
        if (settings.debug) {
          console.info('[Gorgon] Cache hit for key: ' + key, currentVal);
        }

        gorgonCore._callHooks('get', { key, asyncFunc, policy, cacheHit: true, queued: false }, currentVal);

        return currentVal;
      }

      // Are we currently already running this cache item?
      if (hOP.call(currentTasks, key) && Array.isArray(currentTasks[key]) && currentTasks[key].length > 0) {
        // Add to the current task, but ignore if any items is below retry anyway threshold
        var oldQueue = false;

        for (var i in currentTasks[key]) {
          if (currentTasks[key][i].queued < new Date(Date.now() - settings.retry)) {
            oldQueue = true;
          }
        }

        // Add to the current queue
        if (!oldQueue) {
          if (settings.debug) {
            console.info('[Gorgon] Cache miss, in progress, adding to current queue for key: ' + key);
          }

          var concurent = new Promise(function (resolve: (value: R) => void, reject) {
            currentTasks[key].push({
              res: resolve,
              rej: reject,
              queued: new Date(),
            });
          });

          gorgonCore._callHooks('get', { key, asyncFunc, policy, cacheHit: false, queued: true }, concurent);

          return concurent;
        }
      } else {
        // Add current task to list, this is the first one so the primary
        currentTasks[key] = [{ queued: new Date() }];
      }

      try {
        if (settings.debug) {
          console.info('[Gorgon] Cache miss, resolving item for: ' + key);
        }

        // This is the primary item
        const resolver = asyncFunc();

        gorgonCore._callHooks('get', { key, asyncFunc, policy, cacheHit: false, queued: false }, resolver);

        // wait for it to finish then push it out
        const resolvedData = await resolver;

        if (settings.debug) {
          console.info('[Gorgon] Cache resolved, resolved item for: ' + key, resolvedData);
        }

        const val = await gorgonCore.put(key, resolvedData, policyMaker(policy));

        if (hOP.call(currentTasks, key)) {
          for (var i in currentTasks[key]) {
            if (currentTasks[key][i].res) {
              if (settings.debug) {
                console.info('[Gorgon] Cache queue resolved for: ' + key, resolvedData);
              }

              currentTasks[key][i].res(val);
            }
          }

          currentTasks[key] = [];
          delete currentTasks[key];
        }

        return val;
      } catch (e) {
        if (hOP.call(currentTasks, key)) {
          for (var i in currentTasks[key]) {
            if (currentTasks[key][i].rej) {
              currentTasks[key][i].rej(e);
            }
          }

          gorgonCore._callHooks('valueError', { key, asyncFunc, policy, cacheHit: false, queued: false }, e);

          currentTasks[key] = [];
          delete currentTasks[key];
        }

        throw e;
      }
    },
  };

  gorgonCore.addProvider('memory', MemoryCache()); // Default provider, light weight and simple

  return gorgonCore;
})();

export { MemoryCache };
export default Gorgon;
