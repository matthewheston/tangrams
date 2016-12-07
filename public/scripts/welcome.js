function generateUUID(){
    var d = new Date().getTime();
    if(window.performance && typeof window.performance.now === "function"){
        d += performance.now(); //use high-precision timer if available
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

$(function () {
  var socket = io();
  $("#create-room").click(function () {
    var uuid = generateUUID();
    var roles = ["w", "h"]
    var myRole = roles[Math.floor(Math.random() * 2)];
    var sharedView = Math.floor(Math.random() *2);
    var partnerRole = myRole == "w" ? "h" : "w";
    var myLink = "/tangrams/?type=" + myRole + "&room=" + uuid + "&s=" + sharedView + "&r=1&t=0";
    var partnerLink = "/tangrams/?type=" + partnerRole + "&room=" + uuid + "&s=" + sharedView + "&r=1&t=0";
    socket.emit("room-setup", {"keyword": $("#sessionName").val().toLowerCase(), "url": partnerLink});
    $("body").append('<p>Tell your partner the name of your session</p>');
    $("body").append('<p>Then <a href="' + myLink +'">click here</a> to begin.</p>');
  });
  $("#join-room").click(function() {
    socket.emit("get-room", $("#sessionName").val().toLowerCase());
    $("body").append("<p>Please wait...</p>");
  });
  socket.on("send-to-room", function(data) {
    console.log(data);
    if (data[0] == $("#sessionName").val().toLowerCase())
      window.location = data[1];
  });
});
