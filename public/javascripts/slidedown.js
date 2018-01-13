$(document).ready(function() {
  $('.slidedown-btn').click(function() {
    var idx = this.value;
    $('.slidedown-content').eq(idx).slideToggle(400);
  });
  $('.slidedown-btn tr').click(function() {
      $(this).toggleClass("clicked");
    });
});
