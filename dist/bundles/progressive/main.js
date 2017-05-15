(function(modules) {
  var resolves = [];
  var loadedModules = {};
  var loadedBundles = {};

  var SCRIPT_TIMEOUT = 120000;
  var LOADED = 0;

  window.__stealBundle = function(bundleId, bundleModules) {
    if (loadedBundles[bundleId]) {
      resolves.push(loadedBundles[bundleId].resolve);
      loadedBundles[bundleId] = LOADED;
    }

    Object.keys(bundleModules).forEach(function(moduleId) {
      modules[moduleId] = bundleModules[moduleId];
    });

    // resolve each promise, first in first out
    while (resolves.length) resolves.shift()();
  };

  function makeScript() {
    var script = document.createElement("script");

    script.type = "text/javascript";
    script.charset = "utf-8";
    script.async = true;
    script.timeout = SCRIPT_TIMEOUT;

    return script;
  }

  function makeDeferred() {
    var def = Object.create(null);

    def.promise = new Promise(function(resolve, reject) {
      def.resolve = resolve;
      def.reject = reject;
    });

    return def;
  }

  function stealRequire(moduleId) {
    if (loadedModules[moduleId]) {
      return loadedModules[moduleId];
    }

    var mod = (loadedModules[moduleId] = {
      exports: {}
    });

    modules[moduleId].call(mod.exports, stealRequire, mod.exports, mod);
    return mod.exports;
  }

  stealRequire.dynamic = function(moduleId, bundleId) {
    // the bundle is loaded already, resolve right away
    if (loadedBundles[bundleId] === LOADED) {
      return Promise.resolve();
    }

    // the bundle is loading, return its promise
    if (loadedBundles[bundleId]) {
      return loadedBundles[bundleId].promise;
    }

    // add promise to the bundles cache
    var deferred = makeDeferred();
    loadedBundles[bundleId] = deferred;

    // load the bundle using a script tag
    var script = makeScript();
    var head = document.getElementsByTagName("head")[0];

    // TODO: maybe the bundle name should be its id so in this line we could
    // use string interpolation:
    //
    //     `dist/bundles/${bundleId}.js`
    //
    // also, we need to use `dest` here in case the user changed the default
    script.src = "dist/bundles/baz.js";
    var timeout = setTimeout(onScriptLoad, SCRIPT_TIMEOUT);

    function onScriptLoad() {
      // avoid memory leaks in IE.
      script.onerror = script.onload = null;
      clearTimeout(timeout);

      var bundle = loadedBundles[bundleId];
      if (bundle !== LOADED) { // it has not been loaded
        if (bundle) {
          bundle.reject(new Error("Failed to load bundle with id: " + bundleId));
        }
        loadedBundles[bundleId] = undefined;
      }
    }

    head.appendChild(script);
    return deferred.promise;
  };

  // import the main module
  stealRequire(1);
})([
  /*progressive@1.0.0#bar*/
  function(stealRequire, stealExports, module) {
    module.exports = function() {
      console.log("bar executed....");
    };
  },

  /*progressive@1.0.0#main*/
  function(stealRequire, stealExports, module) {
    var bar = stealRequire(0);
    bar();
    stealRequire.dynamic(2, 1).then(function() {
      console.log("baz loaded");
    });
  }
]);
