const Gorgon = require('../index.js');

describe('basic storage - date policy', () => {

  it('gets the results of a promise, Date Policy', async() => {

    var x = new Date();

    x = new Date(x.getTime() + 1000 * 1000);

    const res = await  Gorgon.get('datepolicy1', async() => {
      return 'success';
    }, x);

    return expect(res).toEqual('success');

  });

});