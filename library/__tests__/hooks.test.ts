import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest';
import Gorgon from '../index';

/*
| 'settings'
| 'addProvider'
| 'put'
| 'clear'
| 'clearAll'
| 'overwrite'
| 'get'
| 'valueError'*/

describe('hooks', () => {
  it('sets the settings hook and updates when called', () => {
    const hook = { test: (key, input, oputput) => {} };
    const hookSpy = vi.spyOn(hook, 'test');

    Gorgon.addHook('settings', hook.test);
    Gorgon.settings({ debug: true });
    expect(hookSpy).toHaveBeenCalledWith(
      'settings',
      { debug: true },
      {
        debug: true,
        defaultProvider: 'memory',
        retry: 5000,
      },
    );
  });

  it('sets the addProvider hook and updates when called', () => {
    const hook = { test: (key, input, oputput) => {} };
    const hookSpy = vi.spyOn(hook, 'test');
    const provider = {
      init: () => Promise.resolve(),
      get: (key: string) => Promise.resolve(),
      set: (key: string, value: any, policy: any) => Promise.resolve(value),
      clear: (key?: string) => Promise.resolve(true),
      keys: () => Promise.resolve([]),
    };

    Gorgon.addHook('addProvider', hook.test);
    Gorgon.addProvider('test', provider);
    expect(hookSpy).toHaveBeenCalledWith('addProvider', { name: 'test', provider: provider }, undefined);
  });

  it('sets the put hook and updates when called', async () => {
    const hook = { test: (key, input, oputput) => {} };
    const hookSpy = vi.spyOn(hook, 'test');

    Gorgon.addHook('put', hook.test);
    await Gorgon.put('test', { a: 1 }, { expiry: false, provider: 'memory' });
    expect(hookSpy).toHaveBeenCalledWith(
      'put',
      { key: 'test', value: { a: 1 }, policy: { expiry: false, provider: 'memory' } },
      { a: 1 },
    );
  });

  it('sets the clear hook and updates when called', async () => {
    const hook = { test: (key, input, oputput) => {} };
    const hookSpy = vi.spyOn(hook, 'test');

    Gorgon.addHook('clear', hook.test);
    await Gorgon.clear('test');
    expect(hookSpy).toHaveBeenCalledWith('clear', { key: 'test', provider: undefined }, undefined);
  });

  it('sets the clearAll hook and updates when called', async () => {
    const hook = { test: (key, input, oputput) => {} };
    const hookSpy = vi.spyOn(hook, 'test');

    Gorgon.addHook('clearAll', hook.test);
    await Gorgon.clearAll();
    expect(hookSpy).toHaveBeenCalledWith('clearAll', { provider: undefined }, undefined);
  });

  it('sets the overwrite hook and updates when called', async () => {
    const hook = { test: (key, input, oputput) => {} };
    const hookSpy = vi.spyOn(hook, 'test');
    const funcy = async () => {
      return 'overwritten';
    };

    Gorgon.addHook('overwrite', hook.test);
    await Gorgon.overwrite('testO', funcy, { expiry: false, provider: 'memory' });
    expect(hookSpy).toHaveBeenCalledWith(
      'overwrite',
      { key: 'testO', asyncFunc: funcy, policy: { expiry: false, provider: 'memory' } },
      'overwritten',
    );
  });

  it('sets the get hook and updates when called', async () => {
    const hook = { test: (key, input, oputput) => {} };
    const hookSpy = vi.spyOn(hook, 'test');
    const funcy = async () => {
      return 'gotten';
    };

    Gorgon.addHook('get', hook.test);
    await Gorgon.get('testG', funcy, { expiry: false, provider: 'memory' });
    expect(hookSpy).toHaveBeenCalledWith(
      'get',
      { key: 'testG', asyncFunc: funcy, policy: { expiry: false, provider: 'memory' }, cacheHit: false, queued: false },
      Promise.resolve('gotten'),
    );
  });

  it('sets the valueError hook and updates when called', async () => {
    const hook = { test: (key, input, oputput) => {} };
    const hookSpy = vi.spyOn(hook, 'test');
    const funcy = async () => {
      throw new Error('test');
    };

    Gorgon.addHook('valueError', hook.test);
    try {
      await Gorgon.get('testVE', funcy);
    } catch (e) {
      // error expected
    }
    expect(hookSpy).toHaveBeenCalledWith(
      'valueError',
      {
        key: 'testVE',
        cacheHit: false,
        queued: false,
        asyncFunc: funcy,
        policy: { expiry: false, provider: 'memory' },
      },
      new Error('test'),
    );
  });

  describe('hooks advanced functions', () => {
    it('adds multiple hooks at once', async () => {
      const hook = { test: (key, input, oputput) => {} };
      const hookSpy = vi.spyOn(hook, 'test');

      Gorgon.addHook('settings', [hook.test]);
      Gorgon.settings({ debug: true });

      expect(hookSpy).toHaveBeenCalledWith(
        'settings',
        { debug: true },
        {
          debug: true,
          defaultProvider: 'memory',
          retry: 5000,
        },
      );
    });

    it('console errors when a hook has an error', async () => {
      const hook = {
        test: (key, input, oputput) => {
          throw new Error('this is a bad hook');
        },
      };
      const hookSpy = vi.spyOn(hook, 'test');
      const hookSpy2 = vi.spyOn(console, 'error');

      Gorgon.addHook('settings', hook.test);
      Gorgon.settings({ debug: true });

      expect(hookSpy).toHaveBeenCalledWith(
        'settings',
        { debug: true },
        {
          debug: true,
          defaultProvider: 'memory',
          retry: 5000,
        },
      );

      expect(hookSpy2).toHaveBeenCalledWith('[Gorgon] Hook error for hook: settings', new Error('this is a bad hook'));
    });
  });
});
