var tape = require("tape");
var mudder = require("../");

tape("Fake test", function(test) {
  console.log(mudder);
  test.true(true, "yay!");
  test.end();
});
