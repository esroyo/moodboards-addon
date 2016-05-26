const { CC } = require("chrome");
const ServerSocket = CC("@mozilla.org/network/server-socket;1",
                        "nsIServerSocket",
                        "init");

const Request = require("sdk/request").Request;
const { startServerAsync } = require("addon-httpd");

function getPort() {

    const max = 10000;
    let port = 1338;
    let free = false;

    while (!free) {
        try {
            (new ServerSocket(port, true, 1)).close();
            free = true;
        } catch (e) {
            port += 1;
            if (port > max) {
                throw new Error('Unable to start proxy CORS server');
            }
        }
    }

    return free ? port : null;
}

const srv = startServerAsync(
    getPort(),
    require('sdk/system').pathFor('TmpD')
);

srv.registerPrefixHandler('/proxy/', function(request, response) {
  response.processAsync();
  Request({
      url: request._path.slice(7),
      overrideMimeType: "text/plain; charset=x-user-defined",
      onComplete: function (res) {
          response.setStatusLine(request.httpVersion, res.status, res.statusText);
          response.setHeader('Access-Control-Allow-Origin', '*');
          response.setHeader('Access-Control-Allow-Credentials', 'false');
          response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          if (res.status == 200) {
              ['Content-Type', 'Content-Length'].forEach(function(v) {
                  response.setHeader(v, res.headers[v]);
           });

            response.write(res.text);
          }
        response.finish();
    }
  }).get();
});

require("sdk/system/unload").when(function cleanup() {
    srv.stop(function() {});
});

exports.server = srv;
