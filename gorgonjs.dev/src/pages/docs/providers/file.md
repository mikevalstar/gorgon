---
layout: ../../../layouts/Docs.astro
title: File Provider Caching
selectedNav: file-provider
---

# File Provider Caching

When you're using Gorgon on the server side, you can use the `@gorgonjs/file-provider` to cache files locally. 
This is useful for caching your items between restarts of your server; or to share the cache between multiple instances of your server without having to use a database or redis.

## Usage

First install the packages `npm i @gorgonjs/file-provider` and `npm i @gorgonjs/gorgon`.

```ts
import { Gorgon } from '@gorgonjs/gorgon';
import { FileProvider } from '@gorgonjs/file-provider';

// Create a new instance of the file provider
const fileCache = FileProvider(cachePath, {createSubfolder: false});

// Add the provider to the gorgon instance
Gorgon.addProvider('perm', fileCache);

// Call an API and cache the results forever
const x = await Gorgon.get(`tmdb/movie/${id}`, async() => {
  return axios.get(`${api}/movie/${id}${key}`);
}, {provider: 'perm', expiry: false});
```

## Caveats & Limitations

### Default settings
By default the settings for the cache will create a new sub folder on every boot of the application to avoid caches becoming stale.

### Key names
Because we store the items to disk and there are limitations to filenames on the OS we sanitize the keys (this also prevents a cache key from reading something outside of the cache directory). So it's best to write your cache keys in such a way that they would be a valid file path, and additionally to not put too many files into a separate directory to add in some `/`s for separation of the items.

A console log will be fired on a bad key being created, however it will still be stored. These keys will just be much harder to clear.

### Data Serialization
This provider uses JSON.stringify to serialize the data before storing it to disk. This means that any data that is not serializable will not be stored. This includes functions, classes, and circular references.

To get some additional information on what is serializable and what is not, please refer to the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#description).

If you want to serialize something like Dates, Sets, Maps, etc. we recommend using a library like [superjson](https://www.npmjs.com/package/superjson) to serialize the data before passing it to Gorgon.

To reduce any buts that may come from inconsistent serialization we JSON.stringify the data before sending it back out of the cache.

### Write Failures

In the event of write failure after initializing the provider was successful the provider will just return the cached item. There will be a log of this failure.

However on initial setup of the cache the provider will throw an error if it cannot setup or find the directory.

### Caching Between Starts

To cache between starts you will need to set `createSubfolder` to false. *warning* all cache expiries get lost on restart, anything cached will become a permanent cache

## Options

### `createSubfolder`

*default*: `true`

If set to true, a new subfolder will be created on every boot of the application. This is to avoid stale caches.

### `clearFolder`

*default*: `false`

This will clear teh cache directory on boot. This is useful when not using sub folders.
