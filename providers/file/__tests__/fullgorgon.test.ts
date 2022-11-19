import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest';
import path from 'path';
import fs from 'fs';
import {FileProvider, fileExists} from '../index';
import Gorgon from '../../../library/';

const cachePath = path.join(__dirname, 'cache');

describe('File Provider Gorgon Test', () => {

  it('caches some sample json permenantly', async () => {

    const fileCache = FileProvider(cachePath, {createSubfolder: false});

    Gorgon.addProvider('perm', fileCache);

    const x = await Gorgon.get('perm1', async () => {
      return {a:1};
    }, {provider: 'perm', expiry: false});

    expect(x).toEqual({a:1});

    const exists2 = await fileExists(path.join(cachePath, '/perm1.json'));
    expect(exists2).toBe(true);

  });

});
