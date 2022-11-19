import { describe, it, expect, afterAll } from 'vitest';
import {createValidPath} from '../index';

describe('settings', () => {

  it('fixes invalid paths', () => {

    expect(createValidPath('.././abc')).toEqual('__/_/abc');
    expect(createValidPath('\\abc')).toEqual('_abc');
    expect(createValidPath('~/home')).toEqual('_/home');
    expect(createValidPath('~/////')).toEqual('_/empty');
    expect(createValidPath('abc/def/ghi')).toEqual('abc/def/ghi');
    expect(createValidPath('abc/def/ghi/')).toEqual('abc/def/ghi/empty');
    expect(createValidPath('abc/def/ghi////')).toEqual('abc/def/ghi/empty');
    expect(createValidPath('abc/def/ghi//////')).toEqual('abc/def/ghi/empty');
    expect(createValidPath('///ajskfh-&&&///')).toEqual('/ajskfh-___/empty');

  });

});
