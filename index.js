var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var fs = require('fs');
var path = require('path');
var serveIndex = require('serve-index');

function arraysEqual(a,b) {
    /*
        Array-aware equality checker:
        Returns whether arguments a and b are == to each other;
        however if they are equal-lengthed arrays, returns whether their 
        elements are pairwise == to each other recursively under this
        definition.
    */
    if (a instanceof Array && b instanceof Array) {
        if (a.length!=b.length)  // assert same length
            return false;
        for(var i=0; i<a.length; i++)  // assert each element equal
            if (!arraysEqual(a[i],b[i]))
                return false;
        return true;
    } else {
        return a==b;  // if not both arrays, should be the same
    }
}

images = {}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/welcome.html');
});

app.get('/tangrams', function(req, res){
  res.sendFile(__dirname + '/tangrams.html');
});

app.use('/static', express.static(path.join(__dirname, 'public')))
app.use('/static/images', serveIndex('public/images'))

io.on('connection', function(socket){
  socket.on("room", function(data) {
    socket.join(data);
  });
  socket.on("dropped", function(data) {
    io.sockets.in(data["room"]).emit("stage-update", data["urls"])
    if (data["urls"].length == 4) {
      if (arraysEqual(images[data["room"]], data["urls"])) {
        io.sockets.in(data["room"]).emit("success");
        console.log("success!");
      }
      else {
        io.sockets.in(data["room"]).emit("failure");
          console.log("failure!");
      }
    }
  });
  socket.on("image-select", function(data) {
    if (!images[data["room"]]) {
      images[data["room"]] = [];
    }
    if (images[data["room"]].length == 4) {
      images[data["room"]] = [];
    }
    images[data["room"]].push(data["imageName"]);
  });
  socket.on('chat-message', function(msg){
    io.sockets.in(msg["room"]).emit('chat-message', msg["chat"]);
  });
});

http.listen(4000, function(){
  console.log('listening on *:4000');
});
