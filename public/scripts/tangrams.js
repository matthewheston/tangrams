function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    url = url.toLowerCase(); // This is just to avoid case sensitiveness
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
          results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
$(function() {
  var playerType = getParameterByName("type");
  var round = getParameterByName("r");

  // web socket updates
  var socket = io();
  var room = getParameterByName("room");
  socket.emit("room", room);
  socket.on("stage-update", function(urls) {
    if (playerType == "h") {
      $("#staging-area ul").empty();
      $.each(urls, function(idx, value) {
        $("#staging-area ul").append($("<img>",{src:value,width:"100px",height:"100px",class:"draggable"}));
      });
    }
  });
  socket.on("success", function() {
    $("#staging-area").css("background-color", "#98fb98");
  });
  $('form').submit(function(){
    socket.emit('chat-message', {'id': playerType, 'chat': $('#m').val(), 'room': room});
    $('#m').val('');
    return false;
  });
  socket.on('chat-message', function(msg){
    $("#chat-box").scrollTop(document.getElementById("chat-box").scrollHeight);
    $('#messages').append($('<li>').text(msg));
  });
  

  // hide different areas based on player type in query string
  if (playerType == "w") {
    $("#puzzle-images").hide();
  }
  if (playerType == "h") {
    $("#all-images").hide();
  }

  // select random pieces to be the ones to display to helper
  var randomList = [];
  while (randomList.length < 4) {
    randomNum = Math.floor(Math.random() * 10);
    if ($.inArray(randomNum, randomList) == -1) {
      randomList.push(randomNum);
    }
  }

  // get images to show
  $.ajax({
    url: "/static/images/" + round,
    success: function(data) {
      $(data).find("a:contains(.png)").each(function(idx) {
        var image = $(this).attr("href");
        $("#all-images ul").append($("li")).append($('<img>',{src:image,width:"100px",height:"100px",class:"draggable"}));
        if (playerType == "h") {
          if ($.inArray(idx, randomList) != -1) {
            $("#puzzle-images ul").append($("li")).append($('<img>',{src:image,width:"100px",height:"100px",class:"draggable"}));
            socket.emit("image-select", {"imageName": image, "room": room});
          }
        }
      });
      $(".connectedSortable").sortable({connectWith: ".connectedSortable"});
      $("#staging-area ul").droppable({
        drop: function(event, ui) {
          imgUrls = []
          $("#staging-area ul img").each(function() {
            imgUrls.push($(this).attr("src"));
          });
          socket.emit("dropped", {"urls": imgUrls, "room": room});
        }
      });
      $("#staging-area ul").sortable({
        out: function(event, ui) {
          imgUrls = []
          $("#staging-area ul img").each(function() {
            imgUrls.push($(this).attr("src"));
          });
          socket.emit("dropped", {"urls": imgUrls, "room": room});
        }
      });
    }
  });
});

