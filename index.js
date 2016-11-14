var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var fs = require('fs');
var path = require('path');
var serveIndex = require('serve-index');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/tangrams.html');
});

app.use('/static', express.static(path.join(__dirname, 'public')))
app.use('/static/images', serveIndex('public/images'))

io.on('connection', function(socket){
  socket.on("dropped", function(data) {
    io.emit("stage-update", data["urls"])
  });
});

http.listen(4000, function(){
  console.log('listening on *:4000');
});
