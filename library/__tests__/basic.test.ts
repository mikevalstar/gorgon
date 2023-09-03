import { describe, it, expect, afterAll } from 'vitest';
import Gorgon from '../index';

describe('settings', () => {
  afterAll(() => {
    Gorgon.settings({ debug: false });
  });

  it('returns default settings', () => {
    const retSettigns = Gorgon.settings();

    expect(retSettigns.debug).toEqual(false);
  });

  it('can set debug mode', () => {
    const retSettigns = Gorgon.settings({
      debug: true,
    });

    expect(retSettigns.debug).toEqual(true);
  });
});

describe('basic storage', () => {
  it('gets the results of a promise', async () => {
    const res = await Gorgon.get(
      'sample1',
      async () => {
        return 'success';
      },
      1000,
    );

    return expect(res).toEqual('success');
  });

  it('returns old value, not new value for promise', async () => {
    const res = await Gorgon.get(
      'sample2',
      async () => {
        return 'success';
      },
      1000,
    );

    expect(res).toEqual('success');

    const res2 = await Gorgon.get(
      'sample2',
      async () => {
        return 'failure';
      },
      1000,
    );

    return expect(res2).toEqual('success');
  });

  it('overwtires the current cache item', async () => {
    const res = await Gorgon.get(
      'sample6',
      async () => {
        return 'success';
      },
      1000,
    );

    expect(res).toEqual('success');

    const res2 = await Gorgon.overwrite(
      'sample6',
      async () => {
        return 'success2';
      },
      1000,
    );

    expect(res).toEqual('success');
    expect(res2).toEqual('success2');
  });

  it('cache expires', async () => {
    const res = await Gorgon.get(
      'sample3',
      async () => {
        return 'failure';
      },
      1000,
    );

    expect(res).toEqual('failure');

    // await a time of 1.5 seconds
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const res2 = await Gorgon.get(
      'sample3',
      async () => {
        return 'success';
      },
      1000,
    );

    expect(res2).toEqual('success');
  });

  it('throws and does not cache', async () => {
    try {
      const res = await Gorgon.get(
        'sample4',
        async () => {
          throw 'failure';
        },
        1000,
      );
    } catch (e) {
      expect(e).toEqual('failure');
    }

    const res2 = await Gorgon.get(
      'sample4',
      async () => {
        return 'success';
      },
      1000,
    );

    expect(res2).toEqual('success');
  });

  it('clears all cache items', async () => {
    const res = await Gorgon.get(
      'sample5',
      async () => {
        return 'failure';
      },
      1000,
    );

    await Gorgon.clear();

    const res2 = await Gorgon.get(
      'sample5',
      async () => {
        return 'success';
      },
      1000,
    );

    expect(res2).toEqual('success');
  });

  it('clears a single item that has a permenant cache', async () => {
    const res = await Gorgon.get('sample9', async () => {
      return 'success';
    });

    expect(res).toEqual('success');

    const res2 = await Gorgon.get('sample10', async () => {
      return 'failure';
    });

    expect(res2).toEqual('failure');

    await Gorgon.clear('sample10');

    const res3 = await Gorgon.get('sample9', async () => {
      return 'failure';
    });

    expect(res3).toEqual('success');

    const res4 = await Gorgon.get('sample10', async () => {
      return 'success2';
    });

    expect(res4).toEqual('success2');
  });
});
