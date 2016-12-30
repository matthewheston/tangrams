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

images = {};
keysToUrls = {};
keysToUsers = {};

app.get('/', function(req, res){
  res.sendFile(__dirname + '/welcome.html');
});

app.get('/tangrams', function(req, res){
  res.sendFile(__dirname + '/tangrams.html');
});

app.get('/create', function(req, res){
  res.sendFile(__dirname + '/create_new.html');
});

app.get('/join', function(req, res){
  res.sendFile(__dirname + '/join.html');
});

app.use('/static', express.static(path.join(__dirname, 'public')))
app.use('/static/images', serveIndex('public/images'))

io.on('connection', function(socket){
  socket.on("room-setup", function(data) {
    keysToUrls[data["keyword"]] = data["url"];
  });
  socket.on("get-room", function(roomName) {
    socket.emit("send-to-room", [roomName, keysToUrls[roomName]]);
  });
  socket.on("room", function(data) {
    if (data in keysToUsers) {
      keysToUsers[data] += 1;
      if (keysToUsers[data] == 2) {
        console.log("ROUND BEGIN,"+data+","+new Date().toISOString());
        delete keysToUrls[data];
      }
    }  else {
      keysToUsers[data] = 1;
    }
    socket.join(data);
  });
  socket.on("dropped", function(data) {
    io.sockets.in(data["room"]).emit("stage-update", data["urls"])
    if (data["urls"].length == 4) {
      if (arraysEqual(images[data["room"]], data["urls"])) {
        io.sockets.in(data["room"]).emit("success");
        console.log("ROUND END,"+data["room"]+","+new Date().toISOString());
        setTimeout(function () {
          console.log("ROUND BEGIN,"+data["room"]+","+new Date().toISOString());
        }, 5000);
      }
      else {
        io.sockets.in(data["room"]).emit("failure");
          console.log("FAILURE,"+data["room"]+","+new Date().toISOString());
      }
    }
  });
  socket.on("get-rooms", function(data) {
    socket.emit("room-list", keysToUrls);
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
