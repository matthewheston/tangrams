$(function() {
  var randomList = [];
  while (randomList.length < 4) {
    randomNum = Math.floor(Math.random() * 10);
    if ($.inArray(randomNum, randomList) == -1) {
      randomList.push(randomNum);
    }
  }
  $.ajax({
    url: "images",
    success: function(data) {
      $(data).find("a:contains(.jpg)").each(function(idx) {
        var image = $(this).attr("href");
        $("#all-images ul").append($("li")).append($('<img>',{src:"images/" + image,width:"100px",height:"100px",class:"draggable"}));
        if ($.inArray(idx, randomList) != -1) {
          $("#puzzle-images ul").append($("li")).append($('<img>',{src:"images/" + image,width:"100px",height:"100px",class:"draggable"}));
        }
      });
      $("ul").sortable({connectWith: ".connectedSortable"});
    }
  });
});

