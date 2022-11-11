# Gorgon
An async based caching library for node or the browser.

Pass in a cache key, an async function and optionally a cache length and get back a cached object.

Medusa supports
* Memory storage
* Local / session storage (coming soon)

## Installation

    npm install @mikevalstar/gorgon

    yarn add @mikevalstar/gorgon

    pnpm add @mikevalstar/gorgon

## Usage

```javascript
var Gorgon = require('@mikevalstar/gorgon');

function ex() {
  return Gorgon.get('sample', async() => {
    console.log('cache miss');
    return 'example';
  }, 1000);
}


ex().then(res => {
  console.log(res);
});

ex().then(res => {
  console.log(res);
});

ex().then(res => {
  console.log(res);
});

/* returns:
cache miss
example
example
example */
```

```typescript
import Gorgon from '@mikevalstar/gorgon';

const ex = async() => {
  return Gorgon.get('sample', async() => {
    console.log('cache miss');
    return 'example';
  }, 1000);
}

const res1 = await ex();
console.log(res1);

const res2 = await ex();
console.log(res2);

const res3 = await ex();
console.log(res3);

/* returns:
cache miss
example
example
example */
```

## Project TODO

- [ ] Local storage provider
- [ ] Redis storage provider
- [ ] Examples
- [ ] More documentation

## API

### get = function(key, asyncFunction, policy)

The function will lookup and resolve the value for the previously resolved promise,
if no entry is in the cache the function will resolve the promise and resolve that.

_Functions that throw errors are not cached. or if they return undefined._

The policy value will set the duration of the cache, if no policy is set the object will be cache until cleared manually.

### overwrite = function(key, asyncFunction, policy)

The function will resolve the value for the asnc function and store that result in place of the current object.
The original object will be available while the function resolves.

_Functions that throw errors are not cached. or if they return undefined._

The policy value will set the duration of the cache, if no policy is set the object will be cache until cleared manually.

### put = function(key, value, policy)

Bypass the get function and store an object directly into the cache.

### clear = function(key, provider)

Clear a cached item, if no key is set all items will be cleared. Returns a promise that will resolve to true if successful, or an array of booleans for each key; if provider is not specified it will clear the default provider only.

_You may also clear cache items using a wildcard characters e.g. Gorgon.clear('sample*')_

### settings = function(newSettings)

Send in an updated settings object:

* debug: _will output logging_
* retry: _will allow for the concurrency queue to be bypassed after this interval, default: 5000_

## Policies

### Simple Policy

The simplest policy is to simply set a duration, pass in any integer and the object will be cached for that many miliseconds.

```javascript
Gorgon.get('sample', resolver, 1000).then(res => { console.log(res); });
```

### Date Policy

If you have a specific date and time you would like a cache item to expire, you can pass in a date object

```javascript
var midnight = new Date();
midnight.setHours(24,0,0,0); // midnight
Gorgon.get('sample', resolver, midnight).then(res => { console.log(res); });
```

### Complex Policy
If you have something more complex you would like to do with the policy, you can pass in an object with your specifications.

#### Properties
* `expiry`: Date or amount of milliseconds you would like the cache to expire (**required** but may be set to false)
* `provider`: Specify the provider to use (default: 'memory')

#### Example
```javascript
Gorgon.get('sample', resolver, {
  expiry: 1000,
  provider: 'memory',
}).then(res => { console.log(res); });
```

## Alternate Storage Engines

```javascript
var Gorgon = require('@mikevalstar/gorgon');
var storageCache = require('@mikevalstar/gorgon/storageObjectProvider');
storageCache.setStorage(window.sessionStorage);

Gorgon.addProvider('session', storageCache);
```

## More

### Concurrency
If you request 2 calls at the same time with the same key, the resolver will only resolve once no matter how long the resolver takes. Making a slow API call will only call the API once even if you request the information more then once in a short period. This can be used to help reduce trips to external systems.