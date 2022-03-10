System.import('cc')
System.register("application",[], function (_export, _context) {
  "use strict";

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }
    return obj;
  }


  function createApplication(_ref) {
    var loadJsListFile = _ref.loadJsListFile,
      fetchWasm = _ref.fetchWasm;
    // NOTE: before here we shall not import any module!
    var promise = Promise.resolve();
    return promise.then(function () {
      return _defineProperty({
        start: start
      }, 'import', topLevelImport);
    });
  

  

  

  function start(_ref3) {
    var findCanvas = _ref3.findCanvas;
    var settings;
    var cc;
    return Promise.resolve().then(function () {
      return topLevelImport('cc');
    }).then(function (engine) {
      cc = engine;
      overrideLoader();
      return overrideLoadSettingsJson(cc);
    }).then(function () {
      settings = window._CCSettings;
      return initializeGame(cc, settings, findCanvas).then(function () {
        if (!settings.renderPipeline) return cc.game.run();
      }).then(function () {
        if (settings.scriptPackages) {
          return loadModulePacks(settings.scriptPackages);
        }
      }).then(function () {
        return loadJsList(settings.jsList);
      }).then(function () {
        return loadAssetBundle(settings.hasResourcesBundle, settings.hasStartSceneBundle);
      }).then(function () {
        if (settings.renderPipeline) return cc.game.run();
      }).then(function () {
        cc.game.onStart = onGameStarted.bind(null, cc, settings);
        onGameStarted(cc, settings);
      });
    });
  }

  function topLevelImport(url) {
    return _context["import"]("".concat(url));
  }

  function loadAssetBundle(hasResourcesBundle, hasStartSceneBundle) {
    var promise = Promise.resolve();
    var _cc$AssetManager$Buil = cc.AssetManager.BuiltinBundleName,
      MAIN = _cc$AssetManager$Buil.MAIN,
      RESOURCES = _cc$AssetManager$Buil.RESOURCES,
      START_SCENE = _cc$AssetManager$Buil.START_SCENE;
    var bundleRoot = hasResourcesBundle ? [RESOURCES, MAIN] : [MAIN];

    if (hasStartSceneBundle) {
      bundleRoot.push(START_SCENE);
    }

    return bundleRoot.reduce(function (pre, name) {
      return pre.then(function () {
        return loadBundle(name);
      });
    }, Promise.resolve());
  }

  function loadBundle(name) {
    return new Promise(function (resolve, reject) {
      cc.assetManager.loadBundle(name, function (err, bundle) {
        if (err) {
          return reject(err);
        }

        resolve(bundle);
      });
    });
  }

  function loadModulePacks(packs)
  {
    var script = `System.register([], function(_export, _context) { return { execute: function () {
      System.register("chunks:///_virtual/_rollupPluginModLoBabelHelpers.js",[],(function(e){"use strict";return{execute:function(){function i(e,i){for(var r=0;r<i.length;r++){var t=i[r];t.enumerable=t.enumerable||!1,t.configurable=!0,"value"in t&&(t.writable=!0),Object.defineProperty(e,t.key,t)}}function r(i,t){return(r=e("setPrototypeOf",Object.setPrototypeOf||function(e,i){return e.__proto__=i,e}))(i,t)}e({applyDecoratedDescriptor:function(e,i,r,t,n){var o={};Object.keys(t).forEach((function(e){o[e]=t[e]})),o.enumerable=!!o.enumerable,o.configurable=!!o.configurable,("value"in o||o.initializer)&&(o.writable=!0);o=r.slice().reverse().reduce((function(r,t){return t(e,i,r)||r}),o),n&&void 0!==o.initializer&&(o.value=o.initializer?o.initializer.call(n):void 0,o.initializer=void 0);void 0===o.initializer&&(Object.defineProperty(e,i,o),o=null);return o},assertThisInitialized:function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e},createClass:function(e,r,t){r&&i(e.prototype,r);t&&i(e,t);return e},defineProperty:function(e,i,r){i in e?Object.defineProperty(e,i,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[i]=r;return e},inheritsLoose:function(e,i){e.prototype=Object.create(i.prototype),e.prototype.constructor=e,r(e,i)},initializerDefineProperty:function(e,i,r,t){if(!r)return;Object.defineProperty(e,i,{enumerable:r.enumerable,configurable:r.configurable,writable:r.writable,value:r.initializer?r.initializer.call(t):void 0})},setPrototypeOf:r})}}}));
      
      } }; });`
    var blob = new Blob([script], {
      type: 'text/plain'
    });

    return _context["import"]("".concat(URL.createObjectURL(blob)));
  }

  function loadJsList(jsList) {
    var promise = Promise.resolve(); 
    return promise;
  }
}

  function initializeGame(cc, settings, findCanvas) {
    if (settings.macros) {
      for (var key in settings.macros) {
        cc.macro[key] = settings.macros[key];
      }
    }

    var gameOptions = getGameOptions(cc, settings, findCanvas);
    var success = cc.game.init(gameOptions);

    try {
      if (settings.customLayers) {
        settings.customLayers.forEach(function (layer) {
          cc.Layers.addLayer(layer.name, layer.bit);
        });
      }
    } catch (error) {
      console.warn(error);
    }

    return success ? Promise.resolve(success) : Promise.reject();
  }

  function onGameStarted(cc, settings) {
    window._CCSettings = undefined;
    cc.view.resizeWithBrowserSize(true);
    var launchScene = settings.launchScene; // load scene

    cc.director.loadScene(launchScene, null, function () {
      cc.view.setDesignResolutionSize(720, 1280, 4);
      console.log("Success to load scene: ".concat(launchScene));
    });
  }

  function getGameOptions(cc, settings, findCanvas) {
    // asset library options
    var assetOptions = {
      bundleVers: settings.bundleVers,
      remoteBundles: settings.remoteBundles,
      server: settings.server,
      subpackages: settings.subpackages
    };
    var options = {
      debugMode: settings.debug ? cc.DebugMode.INFO : cc.DebugMode.ERROR,
      showFPS: !false && settings.debug,
      frameRate: 60,
      groupList: settings.groupList,
      collisionMatrix: settings.collisionMatrix,
      renderPipeline: settings.renderPipeline,
      adapter: findCanvas('GameCanvas'),
      assetOptions: assetOptions,
      customJointTextureLayouts: settings.customJointTextureLayouts || [],
      physics: settings.physics,
      orientation: settings.orientation,
      exactFitScreen: settings.exactFitScreen
    };
    return options;
  }

  _export("createApplication", createApplication);

  return {
    setters: [],
    execute: function () {}
  };
});