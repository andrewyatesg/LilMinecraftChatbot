var mc = require('minecraft-protocol');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);

app.set('view engine', 'ejs');

if(process.argv.length < 4 || process.argv.length > 6) {
    console.log("Usage : node index.js <host> <port> [<name>] [<password>]");
    process.exit(1);
}

var client = mc.createClient({version: false,
    host: process.argv[2],
    port: parseInt(process.argv[3]),
    username: process.argv[4] ? process.argv[4] : "echo",
    password: process.argv[5],
    version: '1.10'
});

client.on('connect', function() {
    console.info('connected');
});

client.on('disconnect', function(packet) {
    console.log('disconnected: '+ packet.reason);
});

client.on('chat', function(packet) {
    var jsonMsg = JSON.parse(packet.message);
    if(jsonMsg.translate == 'chat.type.announcement' || jsonMsg.translate == 'chat.type.text') {
        var username = jsonMsg.with[0].text;
        var msg = jsonMsg.with[1];
        console.log(username + ":" + msg);
        io.emit('chat message', username + ": " + msg);
    }
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.render('index', { server: process.argv[2], port: parseInt(process.argv[3]), username: process.argv[4] ? process.argv[4] : "echo" });
});

/*app.post('/', function (req, res) {
    client.write('chat', {message: req.body.message});
});*/

io.on('connection', function (socket) {
    socket.on('chat message', function(msg) {
        console.log(msg);
        client.write('chat', {message: msg});
    });
});

server.listen(8080, function () {
    console.log("Server listening on 8080");
});
