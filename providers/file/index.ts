import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';
import Gorgon, {IGorgonCacheProvider, GorgonPolicySanitized} from '@gorgonjs/gorgon';

interface IGorgonFileCacheProvider extends IGorgonCacheProvider {
  _clear: (key:string) => Promise<boolean>;
}

// checks if a string is a valid path and does not go up directories
export const createValidPath = (path:string, ext?:string) => {
  // regesx for all not alphanumeric characters
  const reg = /[^a-zA-Z0-9\_\-\/]/g;
  const alphaonly = path.replaceAll(reg, '_');
  // replace consecutive /s with a single slash
  const singleSlash = alphaonly.replace(/\/+/g, '/');
  // end the string with "empty" if it ends in a /
  const endSlash = singleSlash.replace(/\/$/, '/empty');

  if(endSlash !== path) {
    console.warn(`Path ${path} was changed to ${endSlash} this may indicate a bad cache key or someone attempting to access files outside of the cache directory`);
  }

  return endSlash + (ext || '');;
};

export const fileExists = (filepath) => {
  return new Promise((resolve, reject) => {
    fs.access(filepath, fs.constants.F_OK, error => {
      resolve(!error);
    });
  });
}

// Wraps the Gorgon get method with a React hook
export const FileProvider = (folder: string, options): IGorgonFileCacheProvider => {

  const _folder = path.resolve(folder);
  const cacheTimers = {};

  const fileCache = {

    init: async() => {
      try {
        // delete all files and folders in the cache folder
        const files = await fg(path.join(_folder,'**/*'), {cwd: '/', onlyFiles: true});

        for (const file of files) {
          await fs.promises.unlink(file);
        }
        const folders = await fg(path.join(_folder,'**/*'), {onlyDirectories: true});
        for (const folder of folders.reverse()) {
          await fs.promises.rmdir(folder);
        }
      } catch (error) {
        throw new Error(`Error initializing file cache: ${error.message}`);
        // we throw here becasue if we can't init the cache it will think any existing files are valid forever
      }

      return;
    },

    get: async (key:string) => {
      const pathFile = createValidPath(key, '.json');

      try{
        // check if the file exists
        const exists = await fileExists(path.join(_folder, pathFile));
        if (!exists) {
          return undefined;
        }

        // read the file
        const file = await fs.promises.readFile(path.join(_folder, pathFile), 'utf8');
        const data = JSON.parse(file);
        return data;
      } catch (e) {
        console.error(`Error reading file ${pathFile}`, e);
        return undefined; // this should cause the app to think the cache is empty and refetch
      }
    },

    set: async(key:string, value:any, policy: GorgonPolicySanitized) => {
      try {
        // checks that the value is serializable
        let json = null as string | null;
        if(value.toJSON){
          json = value.toJSON();
        }else{
          json = JSON.stringify(value);
        }

        const pathTimer = createValidPath(key, '');
        const pathFile = createValidPath(key, '.json');

        // write the file creating the folder if needed
        await fs.promises.mkdir(path.join(_folder, path.dirname(pathFile)), {recursive: true});
        await fs.promises.writeFile(path.join(_folder, pathFile), json, {encoding: 'utf8'});

        if (policy && policy.expiry && policy.expiry > 0) {
          // clear any existing timer
          if (cacheTimers[pathTimer]) {
            clearTimeout(cacheTimers[pathTimer]);
          }

          const to = setTimeout(function() {
            fileCache.clear(pathTimer);
          }, policy.expiry);

          cacheTimers[pathTimer] = to;
        }

        return JSON.parse(json);
      } catch (error) {
        console.error(`Error with storing key ${key}`, error);
        return value; // we return value to try not to break the app and elt it fail on bad FS hooks
      }
    },

    keys: async() => {
      const files = await fg(path.join('**/*'), { cwd: _folder, onlyFiles: true });
      return files.map((file) => file.replace(/\.json$/, ''));
    },

    clear: async(key?:string) => {

      if(!key){
        const keys = await fileCache.keys();
        const proms = keys.map((key) => fileCache._clear(key));
        const results = await Promise.all(proms);
        return results.reduce((acc, cur) => acc && cur, true);
      }

      return fileCache._clear(key);
    },

    _clear: async (key:string) => {
      const pathTimer = createValidPath(key, '');
      const pathFile = createValidPath(key, '.json');

      // clear any existing timer
      if (cacheTimers[pathTimer]) {
        clearTimeout(cacheTimers[pathTimer]);
      }

      try {
        // remove the files
        await fs.promises.unlink(path.join(_folder, pathFile));
      } catch (error) {
        console.error(`Error with clearing key ${key}`, error);
        return false;
      }

      return true;
    },

  };

  return fileCache;

}
