const Gorgon = require('../index.js');

describe('Clear many from storage', () => {

  it('clears many based on wildcard', async() => {

    const res = await Gorgon.get('clearmany1', async() => {
      return 'success';
    }, 1000);

    expect(res).toEqual('success');

    const res2 = await Gorgon.get('clearmany2', async() => {
      return 'success';
    }, 1000);

    expect(res2).toEqual('success');

    await Gorgon.clear('clearmany*');

    const res3 = await Gorgon.get('clearmany1', async() => {
      return 'success2';
    }, 1000);

    expect(res3).toEqual('success2');

    const res4 = await Gorgon.get('clearmany2', async() => {
      return 'success2';
    }, 1000);

    expect(res4).toEqual('success2');


  });

});