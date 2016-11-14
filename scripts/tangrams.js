$(function() {
  $.ajax({
    url: "images",
    success: function(data) {
      $(data).find("a:contains(.jpg)").each(function() {
        var image = $(this).attr("href");
        $("#all-images ul").append($("li")).append($('<img>',{src:"images/" + image,width:"100px",height:"100px",class:"draggable"}));
      });
      $("ul").sortable({connectWith: ".connectedSortable"});
    }
  });
});

