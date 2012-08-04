var http = require('http');
var ecstatic = require('ecstatic')(__dirname + '/static');
var server = http.createServer(ecstatic);
server.listen(8002);

var JSONStream = require('JSONStream');
var shoe = require('shoe');

var sock = shoe(function (stream) {
    var str = JSONStream.stringify();
    str.pipe(stream);
    
    var rows = { x : 0, y : 0, z : 0 };
    
    Object.keys(rows).forEach(function (key) {
        str.write({ key : key, value : rows[key] });
    });
    
    var iv = setInterval(function () {
        var keys = Object.keys(rows);
        var key = keys[Math.floor(Math.random() * keys.length)];
        rows[key] += 5;
        str.write({ key : key, value : rows[key] });
    }, 500);
    
    var onend = function () { clearInterval(iv) };
    stream.on('end', onend);
    stream.on('error', onend);
});
sock.install(server, '/updates');
