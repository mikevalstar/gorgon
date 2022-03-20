
// Created as a function to allow for multiple instances of the memory cache, if needed
const MemoryCacheCreator = () =>{

  const cache = {};
  const hOP = cache.hasOwnProperty;

// Memory cache is about the simplist cache possible, use it as an example
  const memoryCache = {

    init: async() => {
    // This should be used to update the cache on boot,
    // memory cache will be blank on boot by default
      return;
    },

    get: async key => {

      if (hOP.call(cache, key) && cache[key].val) {
      // The cached item exists, return it
        return cache[key].val;
      } else {
      // The cached item does not exist reject
        return undefined;
      }

    },

    set: async(key, value, policy) => {

    // Clear in case it exists
      await  memoryCache.clear(key);

    // Set a timemout to self-remove from the cache if in policy
      var to = false;

      if (policy && policy.expiry && policy.expiry > 0) {
        to = setTimeout(function() {
          memoryCache.clear(key);
        }, policy.expiry);
      }

    // Store the cached item
      cache[key] = {
        policy: policy,
        val: value,
        to: to,
      };

      return value;

    },

    keys: async() => {
      return Object.keys(cache);
    },

    clear: async key => {

    // Clears a single key or complete clear on empty
    // Clear all items in the cache
      if (!key) {
        for (var i in cache) {
          memoryCache._clear(i);
        }
        return true;
      }

      return memoryCache._clear(key);
    },

    _clear: key => {
    // Clear a single item, making sure to remove the extra timeout
      if (hOP.call(cache, key)) {
        if (cache[key].to) {
          clearTimeout(cache[key].to);
        }

        cache[key] = null;
        delete cache[key];
        return true;
      }

      return false;
    },

  };

  return memoryCache;

}

module.exports = MemoryCacheCreator;