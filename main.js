var bar = require("~/bar");
var steal = require("@steal");

bar();

steal.import("~/baz")
  .then(function() {
    console.log("baz loaded");
  });
