import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Gorgon from '../index';

describe('basic storage - date policy', () => {
  beforeAll(() => {
    Gorgon.settings({ debug: true });
  });

  afterAll(() => {
    Gorgon.settings({ debug: false });
  });

  it('gets the results of a promise, console.info happens twice', async () => {
    const consoleSpy = vi.spyOn(console, 'info');

    const res = await Gorgon.get(
      'debug1',
      async () => {
        return 'success';
      },
      1,
    );

    expect(consoleSpy).toHaveBeenCalledTimes(2);
    return expect(consoleSpy).toHaveBeenLastCalledWith('[Gorgon] Cache resolved, resolved item for: debug1', 'success');
  });

  it('gets the results of a promise, then places a resolver in the queue, console.info happens 4 times', async () => {
    const consoleSpy = vi.spyOn(console, 'info');

    const res = Gorgon.get(
      'debug2',
      async () => {
        return 'success';
      },
      1000,
    );

    const res2 = await Gorgon.get(
      'debug2',
      async () => {
        return 'success';
      },
      1000,
    );

    expect(consoleSpy).toHaveBeenCalledTimes(4);
    return expect(consoleSpy).toHaveBeenLastCalledWith('[Gorgon] Cache queue resolved for: debug2', 'success');
  });
});
