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
  var sharedView = parseInt(getParameterByName("s"));
  var time = getParameterByName("t");
  chatType = "";

  if (playerType == "w") {
    chatType = "worker: "
    $("body").prepend("<p></p>");
    $("p").append("You've been assigned the role of <em>worker</em>. ");
    $("p").append("Your partner will describe a series of shapes to you. ");
    $("p").append("Your goal is to drag the correct shapes from the box on the left to the box in the center. ");
    if (!sharedView) {
      $("p").append("Your partner cannot see all of the shapes you see.");
    }
    if (sharedView) {
      $("p").append("Your partner cannot see all of the shapes you see, but they can see the shapes after you drop them in the center box.");
    }
    $("p").append("Chat with your partner using the chat box on the right. ");
    $("p").append("Once you correctly choose the shapes, you'll be automatically redirected to the next challenge.");
    $("body").prepend('<span class="playerType">Worker</span>');
  }
  if (playerType == "h") {
    chatType = "helper: "
    $("body").prepend("<p></p>");
    $("p").append("You've been assigned the role of <em>helper</em>. ");
    $("p").append("Your job is to describe the shapes in the box on the left to your partner. ");
    if (!sharedView) {
      $("p").append("You won't be able to see the shapes your partner selects.");
    }
    if (sharedView) {
      $("p").append("As your partner selects shapes, you'll be able to see them in the center box.");
    }
    $("p").append("Chat with your partner using the chat box on the right. ");
    $("p").append("Once your partner correctly choose the shapes, you'll be automatically redirected to the next challenge.");
    $("body").prepend('<span class="playerType">Helper</span>');
  }

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
    if (round == "3") {
       if (time == "0") {
        $("body").prepend("<p id=\"redirect\">Redirecting to the next round in 5 seconds...</p>");
        setTimeout(function() {
          window.location = window.location.href.replace(/r=3&t=0/,"r=1&t=1").replace(/s=\d/, "s=" + (sharedView ? "0" : "1"));
        }, 5000);
       }
      if (time == "1") {
        $("body").prepend("OKAY U R DONE");
      }
    }
    if (parseInt(round) < 3 && !$("#redirect").length) {
      $("body").prepend("<p id=\"redirect\">Redirecting to the next round in 5 seconds...</p>");
      setTimeout(function() {
        window.location = window.location.href.replace(/r=\d/,"r="+String(parseInt(round) + 1));
      }, 5000);
    }
  });
  socket.on("failure", function() {
    $("#staging-area").css("background-color", "#ff0000");
  });
  $('form').submit(function(){
    socket.emit('chat-message', {'id': playerType, 'chat': chatType + $('#m').val(), 'room': room});
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
  if (playerType == "h" && !sharedView) {
    $("#staging-area").hide();
  }

  // select random pieces to be the ones to display to helper
  var randomList = [];
  while (randomList.length < 4) {
    randomNum = Math.floor(Math.random() * 18);
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

