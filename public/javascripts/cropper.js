var cropper = null;
$("#cropper").click(function(){
  var upperCanvas = $('.upper-canvas');
  var cropperButton = $('#cropper-bottom');
  if(cropper){
    upperCanvas.css("display", "block");
    cropperButton.css("display", "none");
    cropper.destroy();
    cropper = null;
  }else{
    var image = $('#c')[0];
    upperCanvas.css("display", "none");
    cropperButton.css("display", "block");
    cropper = new Cropper(image, {
      aspectRatio: 16 / 9,
      crop: function(e) {
      }
    });
  }
});

$("#cropper-zoomIn").click(function(event){
  cropper.zoom(0.1);
})

$("#cropper-zoomOut").click(function(event){
  cropper.zoom(-0.1);
})

$("#cropper-rotateLeft").click(function(event){
  cropper.rotate(-90);
})

$("#cropper-rotateRight").click(function(event){
  cropper.rotate(90);
})

$("#cropper-capture").click(function(event){
  var croppedCanvas = cropper.getCroppedCanvas();
  var link = document.createElement('a');
  link.href = croppedCanvas.toDataURL();
  link.download = "capture.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
})