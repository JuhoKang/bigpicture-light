var cropper = null;
$("#cropper").click(function(){
  var upperCanvas = $(".upper-canvas");
  var cropperButton = $("#cropper-bottom");
  var zoomInButton = $(".zoomin-btn").show();
  var zoomOutButton = $(".zoomout-btn").show();
  if(cropper){
    upperCanvas.css("display", "block");
    cropperButton.css("display", "none");
    zoomInButton.show();
    zoomOutButton.show();
    cropper.destroy();
    cropper = null;
  }else{
    var image = $("#c")[0];
    upperCanvas.css("display", "none");
    cropperButton.css("display", "block");
    zoomInButton.hide();
    zoomOutButton.hide();
    cropper = new Cropper(image);
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
  var link = document.createElement("a");
  link.href = croppedCanvas.toDataURL();
  link.download = "capture.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
})