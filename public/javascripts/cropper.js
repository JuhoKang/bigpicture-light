var cropper = null;
$("#cropper").click(function (event) {
  var upperCanvas = $('.upper-canvas');
  if(cropper){
    upperCanvas.css("display", "block");
    cropper.destroy();
    cropper = null;
  }else{
    var image = $('#c')[0];
    upperCanvas.css("display", "none");
    cropper = new Cropper(image, {
      aspectRatio: 16 / 9,
      crop: function(e) {
        console.log(e.detail.x);
        console.log(e.detail.y);
        console.log(e.detail.width);
        console.log(e.detail.height);
        console.log(e.detail.rotate);
        console.log(e.detail.scaleX);
        console.log(e.detail.scaleY);
      }
    });
  }
});