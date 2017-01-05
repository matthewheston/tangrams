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
  var xOfX = 2*parseInt(time) + parseInt(round);
  chatType = "";

  if (playerType == "w") {
    chatType = "worker: "
    $("body").prepend('<p id="instructions"></p>');
    $("p").append("You've been assigned the role of <em>worker</em>. ");
    $("p").append("Below, you see a series of shapes. ");
    $("p").append("Your partner, the <em>helper</em> can see 4 of those shapes. ");
    $("p").append("They'll describe the 4 shapes that they can see to you using the chat box on the left side of the screen. ");
    $("p").append("Your goal is to correctly select the 4 shapes your partner sees and put them in the same order your partner sees them. ");
    $("p").append("To select a shape, click on it with your mouse, and drag it to the empty box next to it. Let go of your mouse button to drop the shape in the box. ");
    if (!sharedView) {
      $("p").append("In this round, your partner can't see any of the shapes that you select. ");
    }
    if (sharedView) {
      $("p").append("In this round, your partner can see the shapes you've select after you drop them in the box. ");
    }
    $("p").append("Once you correctly choose the shapes and put them in the right order , you'll be automatically redirected to the next challenge. ");
    $("body").prepend('<span class="playerType">Worker</span>');
  }
  if (playerType == "h") {
    chatType = "helper: "
    $('body').prepend('<p id="instructions"></p>');
    $("p").append("You've been assigned the role of <em>helper</em>. ");
    $("p").append("Below, you see a series of shapes. ");
    $("p").append("Your partner, the <em>worker</em> can see all of the shapes you see, but also many more. ");
    $("p").append("Your goal is to get your partner to correctly select the 4 shapes that you can see out of the many shapes that they see. ");
    $("p").append("To do so, describe the shapes you see using the chat box on the left. ");
    if (!sharedView) {
      $("p").append("In this round, you won't be able to see any of the shapes your partner selects. ");
    }
    if (sharedView) {
      $("p").append("In this round, you'll be able to see the shapes your partner selects after they select each one. ");
    }
    $("p").append("Once your partner correctly choose the shapes and puts them in the correct order, you'll be automatically redirected to the next challenge.");
    $("body").prepend('<span class="playerType">Helper</span>');
  }

  $("<p>Round " + xOfX + " of 4</p>").insertAfter("p");
  

  // web socket updates
  var socket = io();
  var room = getParameterByName("room");
  socket.emit("room", room);
  socket.on("stage-update", function(urls) {
    if (playerType == "h") {
      $("#staging-area ul").empty();
      $.each(urls, function(idx, value) {
        $("#staging-area ul").append($("<img>",{src:value,width:"75px",height:"75px",class:"draggable"}));
      });
    }
  });
  socket.on("success", function() {
    $("#staging-area").css("background-color", "#98fb98");
    if (round == "2") {
       if (time == "0") {
        $("body").prepend("<p id=\"redirect\">Redirecting to the next round in 5 seconds...</p>");
        setTimeout(function() {
          window.location = window.location.href.replace(/r=2&t=0/,"r=1&t=1").replace(/s=\d/, "s=" + (sharedView ? "0" : "1"));
        }, 5000);
       }
      if (time == "1") {
        $("body").empty();
        $("body").append('<span class="welcome">You have completed the exercise.</span>');
      }
    }
    if (parseInt(round) < 2 && !$("#redirect").length) {
      $("body").prepend("<p id=\"redirect\">Redirecting to the next round in 5 seconds...</p>");
      setTimeout(function() {
        window.location = window.location.href.replace(/r=\d/,"r="+String(parseInt(round) + 1));
      }, 5000);
    }
  });
  socket.on("failure", function() {
    // $("#staging-area").css("background-color", "#ff0000");
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
        $("#all-images ul").append($("li")).append($('<img>',{src:image,width:"75px",height:"75px",class:"draggable"}));
        if (playerType == "h") {
          if ($.inArray(idx, randomList) != -1) {
            $("#puzzle-images ul").append($("li")).append($('<img>',{src:image,width:"75px",height:"75px",class:"draggable"}));
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

