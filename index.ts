import MemoryCache from './provider/memory';

export type asyncFunction = () => Promise<any> | (() => any);
export type GorgonSettings = {
  debug: boolean;
  defaultProvider: string;
  retry: number;
}
export type GorgonSettingsInput = {
  debug?: boolean;
  defaultProvider?: string;
  retry?: number;
}
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

  const currentTasks = {} as {[key: string]: GorgonCurrentTaskItem};
  const hOP = currentTasks.hasOwnProperty;

  const settings = {
    debug: false,
    defaultProvider: 'memory',
    retry: 5000,
  } as GorgonSettings;

  const policyMaker = function(incPolicy?: GorgonPolicyInput) {
    const outPolicy = {
      expiry: false,
      provider: settings.defaultProvider,
    } as GorgonPolicySanitized;

    // Blank policy, false, or no policy. lets store forever
    if (!incPolicy) {
      return outPolicy;
    }

    // Type is a full policy object
    if(incPolicy instanceof Date){
      var d = new Date();
      outPolicy.expiry = Math.ceil((incPolicy.getTime() - d.getTime()) / 1000);
    }else if (typeof incPolicy === 'object' && incPolicy.expiry) {
      if(incPolicy.expiry instanceof Date){
        outPolicy.expiry = Math.ceil((incPolicy.expiry.getTime() - d.getTime()) / 1000);
      }else{
        outPolicy.expiry = incPolicy.expiry;
      }
      outPolicy.provider = incPolicy.provider || outPolicy.provider;
    } else if(typeof incPolicy === 'number'){
      outPolicy.expiry = incPolicy;
    }

    // Number is too small, negative or not a number
    outPolicy.expiry = outPolicy.expiry > 0 ? outPolicy.expiry : false;

    return outPolicy;
  };

  const gorgonCore = {

    // Providers available for use
    providers: {} as {[key: string]: IGorgonCacheProvider},

    // Allows for settings on the gorgon cache
    settings: (newSettings?: GorgonSettingsInput) => {
      if (!newSettings) {
        return settings;
      }

      Object.assign(settings, newSettings); // only overwrite ones sent in; keep others at existing

      return settings;
    },

    // Add a provider
    addProvider: (name: string, provider) => {
      provider.init(); // Trigger for provider to clear any old cache items or any other cleanup
      gorgonCore.providers[name] = provider;
    },

    // Place an item into the cache
    put: async<R>(key:string, value:R, policy?: GorgonPolicyInput):Promise<R> => {
      policy = policyMaker(policy);
      var prov = gorgonCore.providers[policy.provider];

      return prov.set(key, value, policyMaker(policy));
    },

        // Clear one or all items in the cache
    clear: async(key: string, provider?: string) => {

      var prov = gorgonCore.providers[provider || settings.defaultProvider];

      // Clear a wildcard search of objects
      if (key && key.indexOf('*') > -1) {
        return prov.keys().then(function(keys) {
          var cacheMatchKeys = keys.filter(function(str) {
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

    // Allows you to instantly overwite a cache object
    overwrite: async(key:string, asyncFunc: asyncFunction, policy?: GorgonPolicyInput) => {

      try{
        const resolvedData = await asyncFunc();

        const val = await gorgonCore.put(key, resolvedData, policyMaker(policy));

        return val;
      }catch (e) {
        throw e;
      }

    },

    // Allows you to get from the cache or pull from the promise
    get: async<R>(key:string, asyncFunc:() => R, policy?: GorgonPolicyInput):Promise<R> => {

      policy = policyMaker(policy);
      const prov = gorgonCore.providers[policy.provider];

      const currentVal = await prov.get(key); // Most providers will only lookup by key and return false on not found

      // If we have a current value sent it out; cache hit!
      if(currentVal !== undefined) {
        return currentVal;
      }

      // Are we currently already running this cache item?
      if (hOP.call(currentTasks, key) && Array.isArray(currentTasks[key]) && currentTasks[key].length > 0) {
        // Add to the current task, but ignore if any items is below retry anyway threshold
        var oldQueue = false;

        for (var i in currentTasks[key]) {
          if(currentTasks[key][i].queued < new Date(Date.now() - settings.retry)) {
            oldQueue = true;
          }
        }

        // Add to the current queue
        if(!oldQueue) {
          var concurent = new Promise(function(resolve: (value: R) => void, reject) {
            currentTasks[key].push({
              res: resolve,
              rej: reject,
              queued: new Date(),
            });
          });

          return concurent;
        }
      }else{
        // Add current task to list, this is the first one so the primary
        currentTasks[key] = [{queued: new Date()}];
      }

      try{
        // This is the primary item, lets resolve and push it out
        const resolvedData = await asyncFunc();

        let val = await gorgonCore.put(key, resolvedData, policyMaker(policy));

        if (hOP.call(currentTasks, key)) {
          for (var i in currentTasks[key]) {
            if(currentTasks[key][i].res) {
              currentTasks[key][i].res(val);
            }
          }

          currentTasks[key] = [];
          delete currentTasks[key];
        }

        return val;

      }catch (e) {
        if (hOP.call(currentTasks, key)) {
          for (var i in currentTasks[key]) {
            if(currentTasks[key][i].rej) {
              currentTasks[key][i].rej(e);
            }
          }

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

export default Gorgon;
