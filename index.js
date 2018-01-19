var http = require("http");
var https = require("https");

module.exports = {
    run: function(params, options) {
        var p = {
            params: params
        };
        if (!options.chatId) {
            throw new Error('Missing options.chatId params');
        }
        p.chatId = options.chatId;

        if (!options.token) {
            throw new Error('Missing options.token params');
        }
        p.token = options.token;

        var paramQueryString = JSON.stringify(p);
        return new Promise(function(resolve, reject) {
            options.request.headers = {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(paramQueryString)
            };

            port = options.request.port == 443 ? https : http;
            var req = port.request(options.request, function(res) {
                res.setEncoding('utf8');
                // reject on bad status
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    return reject(new Error('statusCode=' + res.statusCode));
                }
                // cumulate data
                var body = '';
                res.on('data', function(chunk) {
                    body += chunk;
                });
                // resolve on end
                res.on('end', function() {
                    try {
                        body = JSON.parse(body.toString());
                    } catch ( e ) {
                        reject(e);
                    }

                    resolve(body);
                });
            });
            req.on('socket', function(socket) {
                socket.setTimeout(options.timeout);
                socket.on('timeout', function() {
                    req.abort();
                });
            });
            // reject on request error
            req.on('error', function(err) {
                // This is not a "Second reject", just a different sort of failure
                reject(err);
                if (err.code === "ECONNRESET") {
                    console.log("Timeout occurs");
                //specific error treatment
                }
                console.log(err);
            });

            req.write(paramQueryString, 'utf8');
            req.end();
        });
    }
};
return module.exports;