# Gorgon File Provider

This library implements a file storage provider to [@gorgonjs/gorgon](https://www.npmjs.com/package/@gorgonjs/gorgon), please refer to the documentation on https://gorgonjs.dev for full documentation.

## Installation

    npm install @gorgonjs/file-provider @gorgonjs/gorgon

    yarn add @gorgonjs/file-provider @gorgonjs/gorgon

    pnpm add @gorgonjs/file-provider @gorgonjs/gorgon

## Example Usage

```ts
import { Gorgon } from '@gorgonjs/gorgon';
import { FileProvider } from '@gorgonjs/file-provider';

// Create a new instance of the file provider
const fileCache = FileProvider(cachePath, { createSubfolder: false });

// Add the provider to the gorgon instance
Gorgon.addProvider('perm', fileCache);

// Call an API and cache the results forever
const x = await Gorgon.get(
  `tmdb/movie/${id}`,
  async () => {
    return axios.get(`${api}/movie/${id}${key}`);
  },
  { provider: 'perm', expiry: false },
);
```
