# Gorgon React Client

A typescript async based caching library for react.

Pass in a cache key, an async function and optionally a cache length into the useGorgon hook and get back a cached object.

This library implements a react interface to [@gorgonjs/gorgon](https://www.npmjs.com/package/@gorgonjs/gorgon), please refer to teh documentation on https://gorgonjs.dev for full documentation.

## Installation

    npm install @gorgonjs/react

    yarn add @gorgonjs/react

    pnpm add @gorgonjs/react

## useGorgon = function(key, asyncFunction, policy)

This hook will resolve the value for the async function and store that result in the cache.

Returned will be an object with the following:

### data
This will be the return fully resolved value from your async function. 
null will be returned if the function has not resolved yet or is refetching.

### error = Error
If an error is thrown from your async function it will be stored here. null otherwise.

### loading = boolean
True or false depending on if the function is currently resolving.

### refetch = function(key)
A function that will clear teh current cache and refetch the data, if no key is provided the original key will be used.

## clearGorgon = function(key)
Use this function to clear a cached item at any time.

this is a wrapper to Gorgon.clear();

## Gorgon
The Gorgon object is available for advanced use, please refer to the documentation on https://gorgonjs.dev for full documentation.

## Example

```tsx
import { useEffect, useState } from 'react';
import useGorgon from '../lib/useGorgon';

// A simple component that fetches data from an API and displays it
export default function UseGorgonExample() {

  const [fetchUrl , setFetchUrl] = useState<string>('https://jsonplaceholder.typicode.com/todos/1');

  const {data: jsonData, error, loading, refetch} = useGorgon(
    'todos_useGorgon' + fetchUrl,
    () => { return getDetails(fetchUrl); },
    10000,
    {debug: true}
  );

  if(loading) return <div>Loading...</div>;

  return <div>
    <h2>Fully built useGorgon Example</h2>
    <div className='example-containers'>
      {error && <div>Error: {error.message}</div>}
      <ul>
        <li>🕮 Title: {jsonData && jsonData.title || 'loading...'}</li>
        <li>🕰️ Fetched data at: {jsonData && jsonData.fetchedDate.toString()}</li>
        <li>⏲️ Rendered at: {(new Date()).toString()}</li>
      </ul>
      <button onClick={() => {setFetchUrl('http://badurl.cccccc')}}>Force error state</button>
      <button onClick={() => {setFetchUrl('https://jsonplaceholder.typicode.com/todos/1')}}>Good Url</button>
      <button onClick={() => { refetch(); } }>Force refetch</button>
    </div>
  </div>;
};
```

## More

### Concurrency
If you request 2 calls at the same time with the same key, the resolver will only resolve once no matter how long the resolver takes. Making a slow API call will only call the API once even if you request the information more then once in a short period. This can be used to help reduce trips to external systems.
