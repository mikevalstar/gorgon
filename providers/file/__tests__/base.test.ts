import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest';
import path from 'path';
import fs from 'fs';
import {FileProvider, fileExists} from '../index';

const cachePath = path.join(__dirname, 'cache');

describe('File Provider', () => {

  // turns out mocking the FS is hard and cant do path; so we create and a folder and use that
  // ignored in git ignore
  // you need to create ./cache in the test folder to make this pase
  beforeAll(async () => {
    // create the cache folder
    if(!fs.existsSync(cachePath)){
      fs.mkdirSync(cachePath);
    };

    fs.writeFileSync(path.join(cachePath, 'test.json'), JSON.stringify({test: 'test'}));
  });


  it('checks if a file exists', async () => {
    const exists2 = await fileExists(path.join(cachePath, '../base.test.ts'));
    expect(exists2).toBe(true);
  });

  it('clears the cache folder on init', async () => {
    const preexists = await fileExists( path.join(cachePath, 'test.json'));
    expect(preexists).toBe(true);
    const fileCache = FileProvider(cachePath, {});
    await fileCache.init();
    const exists = await fileExists( path.join(cachePath, 'test.text'));
    expect(exists).toBe(false);
    const exists2 = await fileExists( path.join(cachePath, '../base.test.ts'));
    expect(exists2).toBe(true);
  });

  it('saves some json to disk then can retreive it', async () => {
    const fileCache = FileProvider(cachePath, {});
    await fileCache.init();
    await fileCache.set('test', {a:1}, {expiry: 1000, provider: ''});

    const data = await fileCache.get('test');

    expect(data).toEqual({a:1});

    await fileCache.clear();
  });

  it('clears the cache, 1 key', async () => {
    const fileCache = FileProvider(cachePath, {});
    await fileCache.init();
    await fileCache.set('test', {a:1}, {expiry: 1000, provider: ''});
    await fileCache.set('test2', {a:2}, {expiry: 1000, provider: ''});

    await fileCache.clear('test');

    const data = await fileCache.get('test');
    const data2 = await fileCache.get('test2');

    expect(data).toEqual(undefined);
    expect(data2).toEqual({a:2});

    await fileCache.clear();
  });

  it('clears the cache, all keys', async () => {
    const fileCache = FileProvider(cachePath, {});
    await fileCache.init();
    await fileCache.set('test', {a:1}, {expiry: 1000, provider: ''});
    await fileCache.set('test2', {a:2}, {expiry: 1000, provider: ''});

    await fileCache.clear();

    const data = await fileCache.get('test');
    const data2 = await fileCache.get('test2');

    expect(data).toEqual(undefined);
    expect(data2).toEqual(undefined);
  });

  it('creates some cache entries that will end up making a folder', async () => {
    const fileCache = FileProvider(cachePath, {});
    await fileCache.init();
    await fileCache.set('test/test/test', {a:1}, {expiry: 1000, provider: ''});
    await fileCache.set('test2/test/test', {a:2}, {expiry: 1000, provider: ''});
    await fileCache.set('test/test/test3', {a:3}, {expiry: 1000, provider: ''});

    const data = await fileCache.get('test/test/test');
    const data2 = await fileCache.get('test2/test/test');
    const data3 = await fileCache.get('test/test/test3');

    expect(data).toEqual({a:1});
    expect(data2).toEqual({a:2});
    expect(data3).toEqual({a:3});

    await fileCache.clear();
  });

  it('clears thw file after the policy delay', async () => {
    const fileCache = FileProvider(cachePath, {});
    await fileCache.init();
    await fileCache.set('waiting', {a:1}, {expiry: 500, provider: ''});

    const data = await fileCache.get('waiting');
    expect(data).toEqual({a:1});

    // wait 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const data2 = await fileCache.get('waiting');
    expect(data2).toEqual(undefined);

  });

  it('clears thw file after the policy delay only once', async () => {
    const fileCache = FileProvider(cachePath, {});
    await fileCache.init();
    await fileCache.set('waiting', {a:1}, {expiry: 500, provider: ''});

    // wait 200 ms
    await new Promise((resolve) => setTimeout(resolve, 200));
    await fileCache.set('waiting', {a:1}, {expiry: 500, provider: ''});

    const data = await fileCache.get('waiting');
    expect(data).toEqual({a:1});

    // wait 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const data2 = await fileCache.get('waiting');
    expect(data2).toEqual(undefined);

  });

});
