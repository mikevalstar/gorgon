const MemoryCache = require('./provider/memory.js');

const Gorgon = (() => {

  const currentTasks = {};
  const hOP = currentTasks.hasOwnProperty;

  const settings = {
    debug: false,
    returnMutator: false,
    defaultProvider: 'memory',
    retry: 5000,
  };

  const policyMaker = function(incPolicy) {
    const outPolicy = {
      expiry: false,
      provider: settings.defaultProvider,
    };

    // Blank policy, false, or no policy. lets store forever
    if (!incPolicy) {
      return outPolicy;
    }

    // Type is a full policy object
    if (typeof incPolicy === 'object' && incPolicy.expiry) {
      outPolicy.expiry = incPolicy.expiry;
      outPolicy.provider = incPolicy.provider || outPolicy.provider;
    } else {
      outPolicy.expiry = incPolicy;
    }

    // Date object parsing
    if (outPolicy.expiry.getTime) {
      var d = new Date();

      outPolicy.expiry = Math.ceil((outPolicy.expiry.getTime() - d.getTime()) / 1000);
    }

    // Number is too small, negative or not a number
    outPolicy.expiry = parseInt(outPolicy.expiry) > 0 ? parseInt(outPolicy.expiry) : false;

    return outPolicy;
  };

  const gorgonCore = {

    // Providers available for use
    providers: {},

    // Allows for settings on the gorgon cache
    settings: newSettings => {
      if (!newSettings) {
        return settings;
      }

      Object.assign(settings, newSettings); // only overwrite ones sent in; keep others at existing

      return settings;
    },

    // Add a provider
    addProvider: (name, provider) => {
      provider.init(); // Trigger for provider to clear any old cache items or any other cleanup
      gorgonCore.providers[name] = provider;
    },

    // Place an item into the cache
    put: async(key, value, policy) => {
      policy = policyMaker(policy);
      var prov = gorgonCore.providers[policy.provider];

      return prov.set(key, value, policy);
    },

        // Clear one or all items in the cache
    clear: async(key, provider) => {

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
    overwrite: async(key, asyncFunc, policy) => {

      try{
        const resolvedData = await asyncFunc();

        const val = await gorgonCore.put(key, resolvedData, policyMaker(policy));

        if (settings.returnMutator) {
          return settings.returnMutator(val);
        }

        return val;

      }catch (e) {
        throw e;
      }

    },

    // Allows you to get from the cache or pull from the promise
    get: async(key, asyncFunc, policy) => {

      policy = policyMaker(policy);
      const prov = gorgonCore.providers[policy.provider];

      const currentVal = await prov.get(key, asyncFunc, policy); // Most providersw will only lookup by key and return false on not found

      // If we have a current value sent it out; cache hit!
      if(currentVal !== undefined) {
        if (settings.returnMutator) {
          return settings.returnMutator(currentVal);
        }

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
          var concurent = new Promise(function(resolve, reject) {
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

        if (settings.returnMutator) {
          val = settings.returnMutator(val);
        }

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

module.exports = Gorgon;
