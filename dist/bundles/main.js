/*[loader-shim-config]*/
(function(global) {
  global.steal = global.steal || {};

  // unnormalized module ids to slim module ids
  global.steal.map = {
    baz: 4
  };

  // module ids to bundle ids
  global.steal.bundles = {
    5: 7,
    4: 7
  };

  // bundle ids to bundle addresses
  global.steal.paths = {
    7: "dist/bundles/baz.js"
  };
})(window);

/*[slim-loader]*/
(function(modules) {
  var resolves = [];
  var loadedBundles = {};
  var loadedModules = {};

  /**
   * A map of the module id to its factory function
   * @typedef {Object} ModulesMap
   */

  /**
   * An array of slim modules
   * @typedef {Array.<number, fn>} SlimModules
   */

  /**
   * A slim bundle
   * @typedef {Array} SlimBundle
   * The first item is the bundleId and the rest of it are SlimModule items
   */

  /** @type {ModulesMap} **/
  var modulesMap = {};

  function addModules(mods) {
    mods.forEach(function(m) {
      modulesMap[m[0]] = m[1];
    });
  }

  addModules(modules);

  // bundles would push to this array during eval
  __steal_bundles__ = window.__steal_bundles__ || [];

  var LOADED = 0;
  var SCRIPT_TIMEOUT = 120000;

  // register bundles executed before the main bundle finished loading
  __steal_bundles__.forEach(function(bundle) {
    var bundleId = bundle[0];
    var bundleModules = bundle.slice(1);

    addModules(bundleModules);
    loadedBundles[bundleId] = LOADED;
  });

  // handle bundles loading after main has loaded
  __steal_bundles__.push = function(bundle) {
    var bundleId = bundle[0];
    var bundleModules = bundle.slice(1);

    if (loadedBundles[bundleId]) {
      resolves.push(loadedBundles[bundleId].resolve);
      loadedBundles[bundleId] = LOADED;
    }

    addModules(bundleModules);

    // resolve each promise, first in first out
    while (resolves.length)
      resolves.shift()();
    return Array.prototype.push.call(this, bundle);
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

    modulesMap[moduleId].call(mod.exports, stealRequire, mod.exports, mod);
    return mod.exports;
  }

  function getBundleScript(src) {
    var len = document.scripts.length;

    for (var i = 0; i < len; i += 1) {
      var script = document.scripts[i];

      if (script.src.indexOf(src) !== -1) {
        return script;
      }
    }
  }

  stealRequire.dynamic = function(rawModuleId) {
    var moduleId = steal.map[rawModuleId];
    var bundleId = steal.bundles[moduleId];

    if (!moduleId) {
      throw new Error("Cannot find module with id: " + slimModuleId);
    }

    if (!bundleId) {
      throw new Error("Missing bundle for module with id: " + slimModuleId);
    }

    // if the bundle has been loaded already,
    // return a promise that resolves to the module being imported
    if (loadedBundles[bundleId] === LOADED) {
      return Promise.resolve(stealRequire(moduleId));
    }

    // the bundle is loading, return its promise
    if (loadedBundles[bundleId]) {
      return loadedBundles[bundleId].promise.then(function() {
        return stealRequire(moduleId);
      });
    }

    // add deferred to the bundles cache
    var deferred = makeDeferred();
    loadedBundles[bundleId] = deferred;

    // check if the bundle is being loaded using a script tag
    var script = getBundleScript(steal.paths[bundleId]);
    var scriptAttached = true;

    // load the bundle using a script tag otherwise
    if (!script) {
      script = makeScript();
      script.src = steal.paths[bundleId];
      scriptAttached = false;
    }

    var head = document.getElementsByTagName("head")[0];
    var timeout = setTimeout(onScriptLoad, SCRIPT_TIMEOUT);

    function onScriptLoad() {
      // avoid memory leaks in IE.
      script.onerror = script.onload = null;
      clearTimeout(timeout);

      var bundle = loadedBundles[bundleId];
      if (bundle !== LOADED) {
        if (bundle) {
          bundle.reject(
            new Error("Failed to load bundle with id: " + bundleId)
          );
        }
        loadedBundles[bundleId] = undefined;
      }
    }

    if (!scriptAttached) head.appendChild(script);
    return deferred.promise.then(function() {
      return stealRequire(moduleId);
    });
  };

  // import the main module
  stealRequire(2);
})([
  [
    3,
    function(stealRequire, stealExports, stealModule) {
      stealModule.exports = function bar() { console.log("bar fn called"); };
    }
  ],
  [
    2,
    function(stealRequire, stealExports, stealModule) {
      var bar = stealRequire(3);
      bar();
      stealRequire.dynamic("baz").then(function(baz) {
        console.log("baz loaded");
        baz();
      });
    }
  ]
]);
