#!/bin/sh
mkdir -p vendor/webextension-polyfill/dist
cp node_modules/webextension-polyfill/dist/browser-polyfill.min.js vendor/webextension-polyfill/dist/browser-polyfill.min.js
mkdir -p vendor/foundation-sites/css
cp node_modules/foundation-sites/css/normalize.min.css vendor/foundation-sites/css/normalize.min.css
cp node_modules/foundation-sites/css/foundation.min.css vendor/foundation-sites/css/foundation.min.css
mkdir -p vendor/foundation-sites/js/vendor
cp node_modules/foundation-sites/js/vendor/jquery.js vendor/foundation-sites/js/vendor/jquery.js
cp node_modules/foundation-sites/js/foundation.min.js vendor/foundation-sites/js/foundation.min.js
mkdir -p vendor/fabric/dist
cp node_modules/fabric/dist/fabric.min.js vendor/fabric/dist/fabric.min.js
