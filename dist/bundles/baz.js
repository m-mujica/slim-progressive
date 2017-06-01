/*bundles/baz*/
(__steal_bundles__ = window.__steal_bundles__ || []).push([
  7,
  [
    5,
    function(stealRequire, stealExports, stealModule) {
      stealModule.exports = function foo() {
        console.log("foo fn called");
      };
    }
  ],
  [
    4,
    function(stealRequire, stealExports, stealModule) {
      var foo = stealRequire(5);
      stealModule.exports = function baz() {
        console.log("baz fn called");
        return foo();
      };
    }
  ]
]);
