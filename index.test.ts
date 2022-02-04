import * as mudder from 'mudder';
// import mudder = require("mudder");
// const mudder = require("mudder");

describe('tests', function() {
  it('test generate string', function() {
    expect(mudder.base62.mudder(1)).toBeTruthy();
  });
});