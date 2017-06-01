var foo = require("foo");

module.exports = function baz() {
  console.log("baz fn called");
  return foo();
};
