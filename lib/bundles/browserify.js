module.exports = function(app) {

  "use strict";

  // constants
  const CONFIG_BUNDLES_SECTION = "jaune.bundles";

  // 3rd
  const _fs         = require('fs');
  const _browserify = require('browserify');
  const _map        = require('lodash').map;
  const _reduce     = require('lodash').reduce;
  const _chokidar   = require('chokidar');

  // jaune
  const _env        = app.Environment;

  // settings
  const _bundleSettings = _env.getEnvProperty(CONFIG_BUNDLES_SECTION);

  if (!_bundleSettings) {
    return;
  }

  const watch   = _bundleSettings.watch;
  const bundles = _bundleSettings.bundles;
  const trans   = _bundleSettings.transforms;

  const buildBundle = function(browserify, bundle) {
    try {
      if (trans) {
        browserify = _reduce(trans, function(previous, transform) {
          return previous.transform(transform);
        }, browserify);
      }
      browserify.bundle().pipe(_fs.createWriteStream(bundle.output));
    }
    catch(err) {
      console.log(err);
      console.log(err.stack);
    }
  };

  _map   (bundles, function(bundle) {

    var browserify = _browserify({ entries: bundle.entries });
    var watchers   = [];

    buildBundle(browserify, bundle);

    if (watch && app.Environment.getProcessProperty('type') === 'development') {

      _map(bundle.entries, function(entry) {

        var watcher = _chokidar.watch(entry, {
          ignored: /[\/\\]\./, persistent: true
        });

        watcher.on('change', function(path) { buildBundle(browserify, bundle) });
        watchers.push(watcher);
      });
    }
    return {browserify: browserify, watchers: watchers}
  });

};
