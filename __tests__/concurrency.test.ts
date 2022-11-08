import { describe, it, expect, vi } from 'vitest';
import Gorgon from '../index';

Gorgon.settings({retry: 10});

vi.useRealTimers();

describe('concurrency', () => {

  it('Only calls the function once, when the call is slow', async() => {

    let calledCount = 0;

    const incrementor = async() => {
      return new Promise(resolve => {
        setTimeout(()=> {
          calledCount += 1;
          resolve(true);
        }, 200);
      });
    };

    const res = Gorgon.get('concur1', incrementor, 50);
    const res2 = await Gorgon.get('concur1', incrementor, 50);

    return expect(calledCount).toEqual(1);

  });

  it('Only calls the function once, but rejects both', async() => {

    let calledCount = 0;

    const incrementor = async() => {
      return new Promise((resolve, rej) => {
        setTimeout(()=> {
          calledCount += 1;
          rej(true);
        }, 200);
      });
    };

    try{
      const res = Gorgon.get('concur2', incrementor, 50).catch(e => {
        // error
      });
      const res2 = await Gorgon.get('concur2', incrementor, 50);
    }catch(e) {
      // error?
    }

    return expect(calledCount).toEqual(1);

  });

});
